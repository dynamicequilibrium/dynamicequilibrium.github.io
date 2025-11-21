// script.js

// State
let responses = new Array(config.items.length).fill(null);
let currentQuestionIndex = 0;
let terminology = 'clients';

// DOM elements
const introScreen = document.getElementById('intro-screen');
const methodPopover = document.getElementById('method-popover');
const questionnaireScreen = document.getElementById('questionnaire-screen');
const resultsScreen = document.getElementById('results-screen');
const emailScreen = document.getElementById('email-screen');

const startBtn = document.getElementById('start-btn');
const methodBtn = document.getElementById('method-btn');
const closeMethodBtn = document.getElementById('close-method-btn');
const terminologySelect = document.getElementById('terminology');
const questionContainer = document.getElementById('question-container');
const progressEl = document.getElementById('progress');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pdfBtn = document.getElementById('pdf-btn');
const retakeBtn = document.getElementById('retake-btn');
const shareBtn = document.getElementById('share-btn');
const emailForm = document.getElementById('email-form');
const backToResultsBtn = document.getElementById('back-to-results-btn');

// Event listeners
startBtn.addEventListener('click', () => {
  introScreen.style.display = 'none';
  questionnaireScreen.style.display = 'block';
  loadQuestion();
  // Analytics: start_test
  trackEvent('start_test');
});

methodBtn.addEventListener('click', () => {
  methodPopover.style.display = 'flex';
});

closeMethodBtn.addEventListener('click', () => {
  methodPopover.style.display = 'none';
});

terminologySelect.addEventListener('change', (e) => {
  terminology = e.target.value;
  loadQuestion();
});

prevBtn.addEventListener('click', () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    loadQuestion();
  }
});

nextBtn.addEventListener('click', () => {
  const selected = document.querySelector('input[name="response"]:checked');
  if (selected) {
    responses[currentQuestionIndex] = parseInt(selected.value);
    currentQuestionIndex++;
    if (currentQuestionIndex < config.items.length) {
      loadQuestion();
    } else {
      showResults();
    }
  }
});

pdfBtn.addEventListener('click', () => {
  resultsScreen.style.display = 'none';
  emailScreen.style.display = 'block';
  // Analytics: view_results
  trackEvent('view_results');
});

retakeBtn.addEventListener('click', () => {
  resetApp();
});

shareBtn.addEventListener('click', () => {
  // Simple share
  if (navigator.share) {
    navigator.share({
      title: 'Burnout Check',
      text: 'Check your burnout levels with this quick assessment.',
      url: window.location.href
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  }
  // Analytics: share_clicked
  trackEvent('share_clicked');
});

emailForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email-input').value;
  const consent = document.getElementById('consent').checked;
  if (!consent) return;

  // Compute scores
  const scores = computeScores(responses);

  // Submit to Google Form FIRST (before PDF generation to ensure data is saved)
  const formData = new FormData();
  formData.append('entry.594620301', email); // Email
  formData.append('entry.1269986754', scores.overall.toFixed(1)); // Overall
  formData.append('entry.141899531', scores.sub.personal.toFixed(1)); // Personal
  formData.append('entry.106991767', scores.sub.work.toFixed(1)); // Work
  formData.append('entry.1778783235', scores.sub.patient.toFixed(1)); // Patient
  formData.append('entry.1981787293', JSON.stringify({
    responses: responses,
    scores: scores,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    language: 'en'
  })); // Response JSON
  formData.append('entry.1776455108', 'I agree to receive my PDF by email'); // Consent

  try {
    await fetch('https://docs.google.com/forms/d/e/1FAIpQLSdJl83JuREkO4LNJFzmoUU8SHrU85j3ZVdpvMxPr_IIDG2ivw/formResponse', {
      method: 'POST',
      mode: 'no-cors',
      body: formData
    });
    console.log('Data submitted to Google Form successfully');
  } catch (error) {
    console.error('Google Form submission failed:', error);
  }

  // Generate PDF after form submission
  try {
    const pdfBlob = await generatePDF(responses, email, consent);

    // Create download link for PDF
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Burnout_Check_Report.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    document.getElementById('email-msg').textContent = 'PDF downloaded and data submitted successfully!';
  } catch (error) {
    console.error('PDF generation failed:', error);
    document.getElementById('email-msg').textContent = 'Data submitted! PDF generation may have failed - please try again.';
  }

  // Analytics: email_submit_success
  trackEvent('email_submit_success');
  // Analytics: pdf_generated
  trackEvent('pdf_generated');
});

backToResultsBtn.addEventListener('click', () => {
  emailScreen.style.display = 'none';
  resultsScreen.style.display = 'block';
});

// Functions
function loadQuestion() {
  const item = config.items[currentQuestionIndex];
  const scale = config.response_scales[item.scale];
  let text = item.text;
  if (item.domain === 'patient') {
    text = text.replace(/patients/g, terminology);
  }

  questionContainer.innerHTML = `
    <div class="question">
      <p>${text}</p>
      <div class="options">
        ${scale.labels.map((label, i) => `
          <label class="option">
            <input type="radio" name="response" value="${i}" ${responses[currentQuestionIndex] === i ? 'checked' : ''}>
            <span>${label}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `;

  updateProgress();
  updateNavButtons();
}

function updateProgress() {
  const answered = responses.filter(r => r !== null).length;
  progressEl.textContent = `${answered}/${config.items.length} answered`;
}

function updateNavButtons() {
  prevBtn.disabled = currentQuestionIndex === 0;
  nextBtn.textContent = currentQuestionIndex === config.items.length - 1 ? 'Finish' : 'Next';
}

function showResults() {
  questionnaireScreen.style.display = 'none';
  resultsScreen.style.display = 'block';

  const scores = computeScores(responses);
  renderGauges(scores);
  renderResultsContent(scores);

  // Analytics: complete_test
  trackEvent('complete_test');
}

function computeScores(responses) {
  const scored = config.items.map((it, i) => {
    const idx = responses[i];
    const mapped = config.response_scales[it.scale].map[idx];
    return it.reverse ? (100 - mapped) : mapped;
  });

  const byDomain = { personal: [], work: [], patient: [] };
  config.items.forEach((it, i) => byDomain[it.domain].push(scored[i]));

  const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;

  const sub = {
    personal: mean(byDomain.personal),
    work: mean(byDomain.work),
    patient: mean(byDomain.patient)
  };
  const overall = mean(scored.filter(v => typeof v === 'number'));

  return { items: scored, sub, overall };
}

function renderGauges(scores) {
  const container = document.getElementById('gauges-container');
  container.innerHTML = `
    <div class="gauge overall-gauge">
      <h3>Burnout Index</h3>
      <div class="radial-gauge" data-score="${scores.overall}"></div>
      <p>${scores.overall.toFixed(1)}% — ${getBand(scores.overall).label}</p>
    </div>
    <div class="sub-gauges">
      <div class="gauge">
        <h4>Personal</h4>
        <div class="radial-gauge mini" data-score="${scores.sub.personal}"></div>
        <p>${scores.sub.personal.toFixed(1)}% — ${getBand(scores.sub.personal).label}</p>
      </div>
      <div class="gauge">
        <h4>Work</h4>
        <div class="radial-gauge mini" data-score="${scores.sub.work}"></div>
        <p>${scores.sub.work.toFixed(1)}% — ${getBand(scores.sub.work).label}</p>
      </div>
      <div class="gauge">
        <h4>Patient</h4>
        <div class="radial-gauge mini" data-score="${scores.sub.patient}"></div>
        <p>${scores.sub.patient.toFixed(1)}% — ${getBand(scores.sub.patient).label}</p>
      </div>
    </div>
  `;

  // Animate gauges
  document.querySelectorAll('.radial-gauge').forEach(gauge => {
    const score = parseFloat(gauge.dataset.score);
    animateGauge(gauge, score);
  });
}

function animateGauge(gauge, score) {
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  circle.setAttribute('viewBox', '0 0 100 100');
  circle.innerHTML = `
    <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="10"/>
    <circle cx="50" cy="50" r="45" fill="none" stroke="${getBand(score).color}" stroke-width="10" stroke-dasharray="283" stroke-dashoffset="283" class="progress"/>
  `;
  gauge.appendChild(circle);

  const progress = circle.querySelector('.progress');
  const offset = 283 - (283 * score / 100);
  setTimeout(() => {
    progress.style.strokeDashoffset = offset;
  }, 100);
}

function getBand(score) {
  return config.bands.find(b => score >= b.min && score <= b.max) || config.bands[0];
}

function renderResultsContent(scores) {
  const container = document.getElementById('results-content');
  const overallBand = getBand(scores.overall);
  const personalBand = getBand(scores.sub.personal);
  const workBand = getBand(scores.sub.work);
  const patientBand = getBand(scores.sub.patient);

  const highest = Object.entries(scores.sub).reduce((a, b) => scores.sub[a[0]] > scores.sub[b[0]] ? a : b)[0];

  const tips = {
    personal: "Prioritize sleep windows, micro-recovery, and reduction of allostatic load this week.",
    work: "Trial a boundary experiment (meeting cap, batching), and a 1:1 with your lead on workload/values alignment.",
    patient: "Schedule debriefs/peer support; rotate demanding caseloads where possible; define 'energy budget' per day."
  };

  container.innerHTML = `
    <h2>Your Burnout Index: ${scores.overall.toFixed(1)}% — ${overallBand.label}</h2>
    <p>Higher scores mean higher burnout risk. Your pattern suggests:</p>
    <ul>
      <li>Personal: ${scores.sub.personal.toFixed(1)}% — ${personalBand.label}</li>
      <li>Work: ${scores.sub.work.toFixed(1)}% — ${workBand.label}</li>
      <li>Patient: ${scores.sub.patient.toFixed(1)}% — ${patientBand.label}</li>
    </ul>
    <p><strong>Next steps:</strong> ${tips[highest]}</p>
  `;
}

async function generatePDF(responses, email, consent) {
  // Simple PDF generation using jsPDF (assuming it's loaded)
  // In a real app, you'd include jsPDF library
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    console.warn('jsPDF not loaded, generating placeholder PDF');
    return new Blob(['PDF content placeholder'], { type: 'application/pdf' });
  }

  const doc = new jsPDF();
  const scores = computeScores(responses);

  // Add header to all pages
  const addHeader = () => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('dynamicequilibrium.org', 105, 10, { align: 'right' });
  };

  // Add footer to all pages
  const addFooter = () => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Burnout Prevention Guide - Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
      doc.text('dynamicequilibrium.org', 20, 285);
    }
  };

  addHeader();

  // Add logo if available
  try {
    // Assuming logo-black.png is in the same directory
    const logoImg = new Image();
    logoImg.src = 'logo-black.png';
    await new Promise((resolve) => {
      logoImg.onload = resolve;
      logoImg.onerror = resolve; // Continue even if logo fails to load
    });
    if (logoImg.complete) {
      doc.addImage(logoImg, 'PNG', 20, 20, 30, 30);
    }
  } catch (e) {
    console.log('Logo not loaded, continuing without it');
  }

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Burnout Prevention Guide', 60, 40);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Personalized for: ${email}`, 60, 55);
  doc.text(`Assessment Date: ${new Date().toLocaleDateString()}`, 60, 65);

  // Scores section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Your Burnout Assessment Results', 20, 90);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Overall Burnout Index: ${scores.overall.toFixed(1)}%`, 20, 110);
  doc.text(`Personal Burnout: ${scores.sub.personal.toFixed(1)}%`, 20, 120);
  doc.text(`Work Burnout: ${scores.sub.work.toFixed(1)}%`, 20, 130);
  doc.text(`Client-Related Burnout: ${scores.sub.patient.toFixed(1)}%`, 20, 140);

  // Add new page for tips
  doc.addPage();
  addHeader();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Evidence-Based Strategies for Burnout Prevention', 20, 30);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  let y = 50;

  const tips = [
    {
      title: 'Set Boundaries',
      content: 'Prioritize important tasks, say no or delegate, keep work hours consistent, and resist working late. Create clear work-life boundaries to protect your energy.'
    },
    {
      title: 'Mindfulness and Stress Management',
      content: 'Practice daily mindfulness (meditation, yoga) or progressive muscle relaxation to reduce stress. These techniques help build resilience and emotional regulation.'
    },
    {
      title: 'Self-Care',
      content: 'Maintain 7-9 hours of consistent sleep, balanced nutrition including proteins and fiber, regular physical activity (at least 5,000 steps/day), and nurture social connections to combat isolation.'
    },
    {
      title: 'Reframe Perspective',
      content: 'Break tasks into manageable steps, focus on positive aspects, and celebrate small achievements to combat feelings of inefficacy. Practice gratitude and cognitive reframing.'
    },
    {
      title: 'Ask for Help',
      content: 'Seek support through therapy, colleagues, or friends when overwhelmed. Building a support network is crucial for mental health maintenance.'
    },
    {
      title: 'Take Breaks and Disconnect',
      content: 'Schedule regular breaks, lunchtime away from workstations, and limit after-hours work communications. Digital detox periods are essential for recovery.'
    },
    {
      title: 'Cultivate Hobbies',
      content: 'Engage in enjoyable activities outside work that induce flow states to recharge emotionally. Hobbies provide balance and prevent work from dominating your identity.'
    },
    {
      title: 'Recognition and Value',
      content: 'Seek and provide recognition to sustain motivation and sense of worth beyond work roles. Remember that your value extends beyond professional achievements.'
    }
  ];

  tips.forEach((tip, index) => {
    if (y > 250) {
      doc.addPage();
      y = 30;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${tip.title}`, 20, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(tip.content, 170);
    lines.forEach(line => {
      doc.text(line, 20, y);
      y += 6;
    });
    y += 8;
  });

  // Additional considerations page
  doc.addPage();
  addHeader();

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Additional Considerations', 20, 30);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  y = 50;

  const considerations = [
    'Physical Health: Regular exercise and balanced diet are foundational for resilience against burnout. Physical well-being directly impacts mental health capacity.',
    'Cognitive Strategies: Cognitive restructuring and mindfulness have strong evidence for reducing burnout symptoms. These techniques help reframe negative thought patterns.',
    'Social Support: Building and maintaining supportive relationships is critical for emotional well-being and reducing isolation. Strong social connections act as protective factors.'
  ];

  considerations.forEach(consideration => {
    if (y > 250) {
      doc.addPage();
      y = 30;
    }
    const lines = doc.splitTextToSize(consideration, 170);
    lines.forEach(line => {
      doc.text(line, 20, y);
      y += 6;
    });
    y += 8;
  });

  // Executive Psychotherapy 360° Methodology Section
  doc.addPage();
  addHeader();

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Psychotherapy 360° Methodology', 20, 40);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Specialized approach for working with burnout and high-performing individuals', 20, 60);

  // Create a professional credentials block with fixed positioning
  const credentialsX = 20;
  const credentialsY = 80;
  const photoX = 120;
  const photoY = 80;

  // Professional credentials in a structured block
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Alexander Lebedev, MD, PhD', credentialsX, credentialsY);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Physician • Therapist • Neuroscientist • Entrepreneur', credentialsX, credentialsY + 12);
  doc.text('20 years of clinical practice', credentialsX, credentialsY + 22);
  doc.text('100+ peer-reviewed scientific publications', credentialsX, credentialsY + 32);
  doc.text('Leadership positions at top European universities', credentialsX, credentialsY + 42);
  doc.text('Research in novel therapeutic approaches', credentialsX, credentialsY + 52);
  doc.text('and resilience in mental health', credentialsX, credentialsY + 60);

  // Add profile photo in fixed position next to credentials
  try {
    const profileImg = new Image();
    profileImg.src = 'Alexander.jpg';
    await new Promise((resolve) => {
      profileImg.onload = resolve;
      profileImg.onerror = resolve; // Continue even if image fails to load
    });
    if (profileImg.complete) {
      doc.addImage(profileImg, 'JPG', photoX, photoY, 50, 50);
    }
  } catch (e) {
    console.log('Profile image not loaded, continuing without it');
  }

  // Service description first
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const serviceText = 'Experience comprehensive burnout recovery and performance optimization through evidence-based psychotherapy techniques tailored for executives and high-achievers.';
  const serviceLines = doc.splitTextToSize(serviceText, 170);
  let yPos = 170;
  serviceLines.forEach(line => {
    doc.text(line, 20, yPos);
    yPos += 6;
  });

  // Add space after paragraph
  yPos += 15;

  // Prominent call-to-action
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('BOOK YOUR SESSION TODAY', 20, yPos);

  yPos += 20;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('https://dynamicequilibrium.org/', 20, yPos);


  // Add footers to all pages
  addFooter();

  return doc.output('blob');
}

function resetApp() {
  responses = new Array(config.items.length).fill(null);
  currentQuestionIndex = 0;
  terminology = 'clients';
  terminologySelect.value = 'patients';
  resultsScreen.style.display = 'none';
  emailScreen.style.display = 'none';
  introScreen.style.display = 'block';
}

function trackEvent(event) {
  // Placeholder for analytics
  console.log('Tracking event:', event);
}
