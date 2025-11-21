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
      title: 'Проверка на выгорание',
      text: 'Проверьте уровень выгорания с помощью этой быстрой оценки.',
      url: window.location.href
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('Ссылка скопирована в буфер обмена!');
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
    language: 'ru'
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
    console.log('Starting PDF generation...');
    const pdfBlob = await generatePDF(responses, email, consent);
    console.log('PDF generated successfully, size:', pdfBlob.size);

    // Create download link for PDF
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Burnout_Report.pdf'; // Use English filename to avoid encoding issues
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    document.getElementById('email-msg').textContent = 'PDF downloaded successfully!';
    console.log('PDF download initiated');
  } catch (error) {
    console.error('PDF generation failed:', error);
    document.getElementById('email-msg').textContent = 'Data submitted! PDF generation failed - please try again.';
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
  nextBtn.textContent = currentQuestionIndex === config.items.length - 1 ? t('buttons.finish') : t('buttons.next');
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
      <h3>Индекс выгорания</h3>
      <div class="radial-gauge" data-score="${scores.overall}"></div>
      <p>${scores.overall.toFixed(1)}% — ${getBand(scores.overall).label}</p>
    </div>
    <div class="sub-gauges">
      <div class="gauge">
        <h4>Личное</h4>
        <div class="radial-gauge mini" data-score="${scores.sub.personal}"></div>
        <p>${scores.sub.personal.toFixed(1)}% — ${getBand(scores.sub.personal).label}</p>
      </div>
      <div class="gauge">
        <h4>Работа</h4>
        <div class="radial-gauge mini" data-score="${scores.sub.work}"></div>
        <p>${scores.sub.work.toFixed(1)}% — ${getBand(scores.sub.work).label}</p>
      </div>
      <div class="gauge">
        <h4>Клиенты</h4>
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
    personal: "На этой неделе уделяйте приоритет сну, диете и ментальной рагрузке.",
    work: "Попробуйте эксперимент с ограничением встреч и группировкой задач, проведите личную беседу с руководителем о рабочей нагрузке и ценностях.",
    patient: "Запланируйте разборы/поддержку коллег; по возможности чередуйте сложные задачи с более простыми; планируйте 'энергетический бюджет' на каждый день."
  };


  container.innerHTML = `
    <h2>Ваш индекс выгорания: ${scores.overall.toFixed(1)}% — ${overallBand.label}</h2>
    <p>Более высокие баллы означают более высокий риск выгорания. Ваш профиль предполагает:</p>
    <ul>
      <li>Личное: ${scores.sub.personal.toFixed(1)}% — ${personalBand.label}</li>
      <li>Работа: ${scores.sub.work.toFixed(1)}% — ${workBand.label}</li>
      <li>Клиенты: ${scores.sub.patient.toFixed(1)}% — ${patientBand.label}</li>
    </ul>
    <p><strong>Следующие шаги:</strong> ${tips[highest]}</p>
  `;
}

async function generatePDF(responses, email, consent) {
  console.log('generatePDF called with responses:', responses.length, 'email:', email);

  // Use pdfmake for better Russian text support
  const pdfMake = window.pdfMake;
  if (!pdfMake) {
    console.warn('pdfMake not loaded, falling back to jsPDF');
    // Fallback to jsPDF if pdfMake is not available
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      return new Blob(['PDF generation failed - no PDF library available'], { type: 'text/plain' });
    }
    const doc = new jsPDF();
    doc.text('PDF generation failed - please try again', 20, 20);
    return doc.output('blob');
  }

  // Helper function to load image as data URL
  const loadImageAsDataURL = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  // Load images
  let logoDataURL, photoDataURL;
  try {
    logoDataURL = await loadImageAsDataURL('logo-black.png');
    photoDataURL = await loadImageAsDataURL('Alexander.jpg');
  } catch (error) {
    console.error('Failed to load images:', error);
    // Continue without images if loading fails
    logoDataURL = null;
    photoDataURL = null;
  }

  const scores = computeScores(responses);

  // Create PDF content using pdfMake
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    header: {
      text: 'dynamicequilibrium.org/ru/',
      alignment: 'right',
      fontSize: 8,
      margin: [0, 10, 10, 0]
    },
    footer: function(currentPage, pageCount) {
      return {
        text: `Руководство по профилактике выгорания - Страница ${currentPage} из ${pageCount}`,
        alignment: 'center',
        fontSize: 8,
        margin: [0, 0, 0, 10]
      };
    },
    content: [
      ...(logoDataURL ? [{
        image: logoDataURL,
        width: 150,
        alignment: 'center',
        margin: [0, 0, 20, 20]
      }] : []),
      {
        text: 'Руководство по профилактике выгорания',
        fontSize: 24,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
      {
        text: `Персонализировано для: ${email}`,
        fontSize: 12,
        margin: [0, 0, 0, 5]
      },
      {
        text: `Дата оценки: ${new Date().toLocaleDateString('ru-RU')}`,
        fontSize: 12,
        margin: [0, 0, 0, 20]
      },
      {
        text: 'Результаты вашей оценки выгорания',
        fontSize: 16,
        bold: true,
        margin: [0, 0, 0, 15]
      },
      {
        text: `Общий индекс выгорания: ${scores.overall.toFixed(1)}%`,
        fontSize: 12,
        margin: [0, 0, 0, 5]
      },
      {
        text: `Личное выгорание: ${scores.sub.personal.toFixed(1)}%`,
        fontSize: 12,
        margin: [0, 0, 0, 5]
      },
      {
        text: `Рабочие выгорание: ${scores.sub.work.toFixed(1)}%`,
        fontSize: 12,
        margin: [0, 0, 0, 5]
      },
      {
        text: `Выгорание, связанное с клиентами: ${scores.sub.patient.toFixed(1)}%`,
        fontSize: 12,
        margin: [0, 0, 0, 20]
      }
    ]
  };

  // Add tips section
  docDefinition.content.push(
    {
      text: 'Научно-обоснованные стратегии профилактики выгорания',
      fontSize: 18,
      bold: true,
      margin: [0, 20, 0, 15],
      pageBreak: 'before'
    }
  );

  const tips = [
    {
      title: 'Устанавливайте границы',
      content: 'Создавайте четкие границы в работе и личной жизни, чтобы защитить свою энергию. Приоритизируйте важные задачи, научитесь говорить "нет" или делегировать, поддерживайте постоянные рабочие часы и избегайте работы допоздна. Это поможет предотвратить истощение и сохранить баланс.'
    },
    {
      title: 'Осознанность и управление стрессом',
      content: 'Регулярная практика осознанности — медитация, йога или прогрессивная мышечная релаксация — снижает уровень стресса и помогает развить эмоциональную устойчивость. Эти техники позволяют лучше регулировать эмоции, снижать тревогу и улучшать общее самочувствие.'
    },
    {
      title: 'Забота о себе',
      content: 'Физическое здоровье напрямую влияет на психическое благополучие. Поддерживайте 7-9 часов качественного сна, питайтесь с достаточным количеством белков и клетчатки, старайтесь делать минимум 5000 шагов в день и развивайте социальные связи.'
    },
    {
      title: 'Измените перспективу',
      content: 'Разбивайте сложные задачи на небольшие, управляемые шаги. Празднуйте даже маленькие достижения, чтобы поддерживать мотивацию. Практикуйте благодарность и осознанность, чтобы проработать негативные паттерны мышления.'
    },
    {
      title: 'Просите помощи',
      content: 'Не стесняйтесь обращаться за поддержкой — к терапевту, коллегам или друзьям, когда чувствуете перегрузку. Наше окружение критически важно для поддержания психического здоровья. Помните, что просить помощи — это признак силы, а не слабости.'
    },
    {
      title: 'Делайте перерывы и отключайтесь',
      content: 'Регулярные перерывы в течение дня, обед вдали от рабочего места и ограничение коммуникаций после работы помогают восстановить энергию. Периоды цифрового детокса особенно важны в наше время, когда мы постоянно подключены к устройствам.'
    },
    {
      title: 'Развивайте хобби',
      content: 'Найдите дела вне работы, которые приносят удовольствие и вызывают состояние потока — это помогает эмоциональной перезарядке. Хобби обеспечивают баланс в жизни и добавляют в нее вдохновение.'
    },
    {
      title: 'Признание и ценность',
      content: 'Ищите и предоставляйте признание за достижения, чтобы поддерживать мотивацию и чувство собственной ценности. Помните, что ваша ценность как человека выходит далеко за рамки профессиональных достижений — включайте в жизнь разнообразные роли и интересы.'
    }
  ];

  tips.forEach((tip, index) => {
    docDefinition.content.push(
      {
        text: `${index + 1}. ${tip.title}`,
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      {
        text: tip.content,
        fontSize: 11,
        margin: [0, 0, 0, 10]
      }
    );
  });

  // Add additional considerations
  docDefinition.content.push(
    {
      text: 'Дополнительные соображения',
      fontSize: 16,
      bold: true,
      margin: [0, 20, 0, 15],
      pageBreak: 'before'
    }
  );

  const considerations = [
    'Физическое здоровье: Регулярные упражнения и сбалансированная диета являются основой устойчивости к выгоранию. Физическое благополучие напрямую связано с ментальным здоровьем и устойчивостью к выгоранию.',
    'Когнитивные стратегии: Доказана эффективность техник когнитивной реструктуризация и практик осознанности для снижения симптомов выгорания. Эти техники помогают переосмыслить негативные паттерны мышления.',
    'Социальная поддержка: Построение и поддержание гармоничных отношений критически важно для эмоционального благополучия и снижения изоляции. Прочные социальные связи являются надежной защитой от выгорания.'
  ];

  considerations.forEach(consideration => {
    docDefinition.content.push(
      {
        text: consideration,
        fontSize: 12,
        margin: [0, 0, 0, 10]
      }
    );
  });

  // Add methodology section
  docDefinition.content.push(
    {
      text: 'Методология исполнительной психотерапии 360°',
      fontSize: 20,
      bold: true,
      margin: [0, 20, 0, 10],
      pageBreak: 'before'
    },
    {
      text: 'Специализированный подход к работе с выгоранием и высокопроизводительными людьми',
      fontSize: 14,
      margin: [0, 0, 0, 20]
    },
    ...(photoDataURL ? [{
      image: photoDataURL,
      width: 100,
      alignment: 'center',
      margin: [0, 0, 10, 10]
    }] : []),
    {
      text: 'Александр Лебедев, MD, PhD',
      fontSize: 16,
      bold: true,
      margin: [0, 0, 0, 10]
    },
    {
      text: 'Врач • Психотерапевт • Нейробиолог • Предприниматель',
      fontSize: 11,
      margin: [0, 0, 0, 5]
    },
    {
      text: '20 лет практики',
      fontSize: 11,
      margin: [0, 0, 0, 5]
    },
    {
      text: '100+ рецензируемых научных публикаций',
      fontSize: 11,
      margin: [0, 0, 0, 5]
    },
    {
      text: 'Руководящие позиции в ведущих европейских университетах',
      fontSize: 11,
      margin: [0, 0, 0, 5]
    },
    {
      text: 'Исследования в области новых подходов к терапии',
      fontSize: 11,
      margin: [0, 0, 0, 5]
    },
    {
      text: 'и устойчивости в сфере ментальнго здоровья',
      fontSize: 11,
      margin: [0, 0, 0, 20]
    },
    {
      text: 'Получите всестороннее восстановление от выгорания и оптимизацию производительности через научно-обоснованные техники, адаптированные для руководителей и высокопроизводительных людей.',
      fontSize: 11,
      margin: [0, 0, 0, 30]
    },
    {
      text: 'ЗАПИШИТЕСЬ НА СЕАНС СЕГОДНЯ',
      fontSize: 20,
      bold: true,
      margin: [0, 0, 0, 20]
    },
    {
      text: 'https://dynamicequilibrium.org/ru/',
      fontSize: 14,
      bold: true,
      margin: [0, 0, 0, 10]
    }
  );

  // Generate PDF
  const pdfDoc = pdfMake.createPdf(docDefinition);
  return new Promise((resolve) => {
    pdfDoc.getBlob((blob) => {
      resolve(blob);
    });
  });
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
