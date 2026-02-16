// script.js

// Array of all possible values
const originalValues = [
  { name: "Nature Connectedness", description: "Harmony with nature and its elements." },
  { name: "Environment", description: "Preserving natural environments and ecosystems." },
  { name: "Autonomy", description: "Being self-directed and independent in thoughts and actions." },
  { name: "Religion", description: "Following religious beliefs and practices." },
  { name: "Family", description: "Valuing and prioritizing family relationships." },
  { name: "Innovation", description: "Pursuing new ideas and creative approaches to problems." },
  { name: "Forgiveness", description: "Letting go of resentment and moving forward with ease, understanding and compassion." },
  { name: "Order", description: "Preferring organization, predictability, and structure." },
  { name: "Critical Thinking", description: "Deeply analyzing and questioning assumptions to clarify complexities." },
  { name: "Service", description: "Dedicating oneself to a greater cause beyond personal gain." },
  { name: "Compassion", description: "Showing empathy and kindness towards others." },
  { name: "Education", description: "Valuing the acquisition of knowledge and learning." },
  { name: "Integrity", description: "Adhering to moral and ethical principles." },
  { name: "Freedom", description: "Valuing the ability to speak, act, and think without hindrance." },
  { name: "Courage", description: "Facing fears and standing up for what is right." },
  { name: "Justice", description: "Promoting fairness, equality, and accountability." },
  { name: "Health", description: "Prioritizing physical, mental, and emotional well-being." },
  { name: "Fame", description: "Being widely recognized and esteemed." },
  { name: "Respect", description: "Showing consideration and appreciation for others and oneself." },
  { name: "Loyalty", description: "Being faithful to commitments and obligations." },
  { name: "Creativity", description: "Expressing oneself through original ideas and innovation." },
  { name: "Joy", description: "Finding happiness and fulfillment in life." },
  { name: "Leadership", description: "Inspiring and guiding others towards a common goal." },
  { name: "Humility", description: "Having a modest view of one's importance." },
  { name: "Empowerment", description: "Encouraging and enabling others to take action and control over their lives." },
  { name: "Altruism", description: "Selflessly acting for the well-being of others." },
  { name: "Adventure", description: "Seeking new and exciting experiences." },
  { name: "Wisdom", description: "Applying knowledge, experience, and insight to make sound decisions." },
  { name: "Balance", description: "Maintaining harmony among different aspects of life." },
  { name: "Stability", description: "Maintaining consistency and reliability in life." },
  { name: "Gratitude", description: "Being thankful for the good in life and expressing appreciation." },
  { name: "Honor", description: "Upholding principles of integrity and respect." },
  { name: "Generosity", description: "Giving freely and abundantly without expecting anything in return." },
  { name: "Persistence", description: "Continuing firmly in a course of action despite difficulty." },
  { name: "Curiosity", description: "Having a strong desire to learn and understand." },
  { name: "Responsibility", description: "Being accountable for one's actions and their consequences." },
  { name: "Power", description: "Exerting control or influence over others." },
  { name: "Tradition", description: "Valuing and preserving cultural practices and norms." },
  { name: "Inclusion", description: "Ensuring everyone has an opportunity to be involved and accepted." },
  { name: "Sustainability", description: "Meeting needs without compromising the ability of future generations." },
  { name: "Authenticity", description: "Living sincerely, in harmony with one’s true thoughts and feelings." },
  { name: "Resilience", description: "Recovering quickly from difficulties; toughness." },
  { name: "Peace", description: "Striving for harmony and freedom from conflict." },
  { name: "Love", description: "Feeling deep affection and caring for someone or something." },
  { name: "Optimism", description: "Having a hopeful and positive outlook on the future." },
  { name: "Mindfulness", description: "Being present and fully engaged with the current moment." },
  { name: "Efficiency", description: "Achieving maximum productivity with minimum wasted effort or expense." },
  { name: "Security", description: "Feeling safe and protected in one's environment or relationships." },
  { name: "Wealth", description: "Accumulating material wealth and financial gain." },
  { name: "Empathy", description: "Understanding and sharing the feelings of another." },
  { name: "Humor", description: "Appreciating and expressing what is funny, amusing, or ludicrous." },
  { name: "Meaningful Work", description: "Engaging in work that has a significant and positive impact." },
  { name: "Patience", description: "Calmly accepting delays and challenges without frustration." },
  { name: "Discipline", description: "Cultivating self-control and a code of behavior, consistency and self-guidance." },
  { name: "Mastery", description: "Surpassing ordinary standards to achieve excellence." },
  { name: "Equality", description: "Believing in and working towards equal rights and opportunities for all." },
  { name: "Self-Reflection", description: "Examining and contemplating one's own thoughts, feelings, and behaviors." },
  { name: "Collaboration", description: "Working jointly with others to produce or create something." },
  { name: "Adaptability", description: "Being able to adjust to new conditions or environments." },
  { name: "Transparency", description: "Operating in a way that is open and clear to others." },
  { name: "Diligence", description: "Persistently and effortfully working towards goals." },
  { name: "Spirituality", description: "Finding a sense of peace and purpose in something greater than oneself." },
  { name: "Supportiveness", description: "Supporting those who might otherwise be excluded or marginalized." },
  { name: "Intuition", description: "Understanding something instinctively, without the need for conscious reasoning." },
];

// Current deck state
let currentPool = [...originalValues];

// DOM
const cardContainer = document.getElementById('card-container');
const keepPile = document.getElementById('keep');
const discardPile = document.getElementById('discard');
const instr = document.getElementById('instructions');
const welcomeScreen = document.getElementById('welcome-screen');
const mainContent   = document.getElementById('main-content');
const startBtn      = document.getElementById('start-btn');

// On “Next”, show the test and start the first stage
startBtn.addEventListener('click', () => {
  welcomeScreen.style.display = 'none';
  mainContent.style.display   = 'block';
  loadStage();
});

const resultScreen = document.getElementById('result-screen');
const discardArrow = document.getElementById('discardArrow');
const keepArrow = document.getElementById('keepArrow');

// Swipe detection threshold (px)
const threshold = 80;

// Dynamically update the instruction text
function updateInstructions() {
  const total = currentPool.length;
  const half = Math.ceil(total / 2);
  if (half > 5) {
    instr.innerHTML = `Keep no more than <span class="highlight">${half}</span> cards out of ${total}.`;
  } else {
    instr.innerHTML = `Keep exactly <span class="highlight">5</span> cards out of ${total}.`;
  }
}

// Create a card element
function makeCard(item) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `<h2>${item.name}</h2><p>${item.description}</p>`;

  let startX = 0;
  card.addEventListener('pointerdown', e => {
    card.setPointerCapture(e.pointerId);
    startX = e.clientX;
    card.classList.add('dragging');
  });
  card.addEventListener('pointermove', e => {
    if (!card.classList.contains('dragging')) return;
    const dx = e.clientX - startX;
    card.style.transform = `translateX(${dx}px) rotate(${dx/10}deg)`;
  });
  card.addEventListener('pointerup', e => {
    card.releasePointerCapture(e.pointerId);
    card.classList.remove('dragging');
    const dx = e.clientX - startX;
    if (dx < -threshold) swipe(card, 'discard');   // left → discard
    else if (dx > threshold) swipe(card, 'keep');  // right → keep
    else card.style.transform = '';
  });
  return card;
}

// Swipe animation and follow-up logic
function swipe(card, action) {
  const animClass = action === 'keep' ? 'swipe-left' : 'swipe-right';
  card.classList.add(animClass);
  card.addEventListener('animationend', () => {
    card.remove();
    const targetPile = action === 'keep' ? keepPile : discardPile;
    targetPile.appendChild(card);
    // Update count
    const countEl = targetPile.querySelector('.count');
    countEl.textContent = `(${targetPile.querySelectorAll('.card').length})`;
    card.classList.remove(animClass);
    card.style.transform = '';
    if (cardContainer.children.length === 0) onDeckCleared();
  }, { once: true });
}

// After the current deck has been processed
function onDeckCleared() {
  // Collect kept cards
  const kept = Array.from(keepPile.querySelectorAll('.card')).map(c => ({
    name: c.querySelector('h2').textContent,
    description: c.querySelector('p').textContent
  }));
  // If ≤ 5 cards — show the result, but ensure exactly 5
  if (kept.length <= 5) {
    // If the user kept fewer than 5 — top up from discarded
    let padded = [...kept];
    const discarded = Array.from(discardPile.querySelectorAll('.card')).map(c => ({
      name: c.querySelector('h2').textContent,
      description: c.querySelector('p').textContent
    }));
    for (let i = padded.length; i < 5 && i - padded.length < discarded.length; i++) {
      padded.push(discarded[i - padded.length]);
    }
    showResult(padded);
  } else {
    // Otherwise prepare a new deck and reload
    currentPool = kept;
    loadStage();
  }
}

// Load a stage: render cards and init
function loadStage() {
  // Clear
  cardContainer.innerHTML = '';
  keepPile.innerHTML = `<h2>Keep <span class="count">(0)</span></h2>`;
  discardPile.innerHTML = `<h2>Discard <span class="count">(0)</span></h2>`;

  // Update instruction
  updateInstructions();

  // Render the stack
  currentPool.forEach(item => cardContainer.appendChild(makeCard(item)));
}

// Show the final result
function showResult(finalValues) {
  // Hide instruction and piles
  document.querySelector('.pile-container').style.display = 'none';
  document.getElementById('prompt').style.display = 'none';
  instr.style.display = 'none';
  // Hide cards
  cardContainer.style.display = 'none';
  // Show result screen
  resultScreen.style.display = 'block';

  // Insert HTML
  const list = finalValues.map((v,i) =>
    `<div><strong>${i+1}. ${v.name}</strong><p>${v.description}</p></div>`
  ).join('');
  resultScreen.innerHTML = `
    <h2>Your Top ${finalValues.length} Values</h2>
    ${list}
    <hr>
    <p>Would you like to receive a personalized breakdown and relevant updates by email?</p>
    <form id="lead-form">
      <input type="email" id="email-input"
             placeholder="your email" required
             style="width:100%; padding:8px; margin-bottom:8px;">
      <button type="submit" style="padding:8px 16px;">Send to my email</button>
    </form>
    <div id="form-msg" style="margin-top:12px;"></div>
  `;
  // Attach submit handler
  document
    .getElementById('lead-form')
    .addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('email-input').value;

      // Collect params
      const params = new URLSearchParams();
      params.append("entry.31354551", email);                // email
      params.append("entry.966123078", finalValues[0].name); // Value 1
      params.append("entry.416258899", finalValues[1].name); // Value 2
      params.append("entry.828951366", finalValues[2].name); // Value 3
      params.append("entry.900630693", finalValues[3].name); // Value 4
      params.append("entry.187289491", finalValues[4].name); // Value 5

      fetch(
        'https://docs.google.com/forms/d/e/1FAIpQLSck5oDr3fRmKq313E8e09wodhQQl-WwBwtE4-Rdj7wy1OGENQ/formResponse',
        {
          method: 'POST',
          mode: 'no-cors',               // disable CORS check
          body: params
        }
      )
      .then(() => {
        // Even without a response, assume it went through
        document.getElementById('form-msg').textContent =
          'Thanks! Your submission has been received.';
        // Optionally hide the form
        document.getElementById('lead-form').style.display = 'none';
      })
      .catch(() => {
        document.getElementById('form-msg').textContent =
          'Something went wrong. Please try again later.';
      });
    });
}

// Fallback buttons (simulate swipe on click)
discardArrow.addEventListener('click', () => {
  const top = cardContainer.lastElementChild; // take the top card
  if (top) swipe(top, 'discard');
});
keepArrow.addEventListener('click', () => {
  const top = cardContainer.lastElementChild; // take the top card
  if (top) swipe(top, 'keep');
});
