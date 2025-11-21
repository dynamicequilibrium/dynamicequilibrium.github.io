// i18n.js - Basic internationalization support
const i18n = {
  en: {
    title: "Burnout Check — 2-minute self-assessment",
    sub: "A quick, evidence-based snapshot of your energy and work strain.",
    note: "This is not a diagnosis. If you're concerned, speak with a qualified professional.",
    instructions: {
      p1: "Answer all 19 statements by choosing what fits you recently.",
      p2: "There are no right/wrong answers. Be honest; it's anonymous.",
      p3: "You'll see your overall score and three domains with simple explanations.",
      p4: "Optionally, get a PDF + tips via email."
    },
    buttons: {
      start: "Start",
      method: "Learn about the method",
      close: "Close",
      next: "Next",
      finish: "Finish",
      previous: "Previous",
      pdf: "Get my PDF + tips",
      retake: "Retake",
      share: "Share",
      send: "Send PDF",
      back: "Back to Results"
    },
    method: {
      title: "About the Copenhagen Burnout Inventory (CBI-19)",
      content: "We use the Copenhagen Burnout Inventory (CBI-19) with three domains: Personal, Work, Patient-related burnout. Scores range 0–100 (higher = more burnout)."
    },
    progress: "answered",
    terminology: "Terminology:",
    results: {
      headline: "Your Burnout Index: {overall}% — {band}",
      blurb: "Higher scores mean higher burnout risk. Your pattern suggests:",
      personal: "Personal: {personal}% — {band}",
      work: "Work: {work}% — {band}",
      patient: "Patient: {patient}% — {band}",
      nextSteps: "Next steps:",
      tips: {
        personal: "Prioritize sleep windows, micro-recovery, and reduction of allostatic load this week.",
        work: "Trial a boundary experiment (meeting cap, batching), and a 1:1 with your lead on workload/values alignment.",
        patient: "Schedule debriefs/peer support; rotate demanding caseloads where possible; define 'energy budget' per day."
      }
    },
    email: {
      title: "Get Your Personalized PDF Report",
      description: "Enter your email to receive a detailed PDF with your scores, interpretations, and tailored recovery tips.",
      consent: "Email me my PDF and occasional research-based tips. You can unsubscribe anytime.",
      sent: "PDF downloaded! You can also email it to yourself."
    },
    bands: {
      low: "Low–Moderate strain",
      elevated: "Elevated strain",
      high: "High strain"
    }
  },
  ru: {
    // Russian translations (placeholders)
    title: "Проверка на выгорание — 2-минутная самооценка",
    sub: "Быстрый, основанный на доказательствах снимок вашей энергии и нагрузки на работе.",
    note: "Это не диагноз. Если вы обеспокоены, обратитесь к квалифицированному специалисту.",
    instructions: {
      p1: "Ответьте на все 19 утверждений, выбрав то, что подходит вам недавно.",
      p2: "Нет правильных/неправильных ответов. Будьте честны; это анонимно.",
      p3: "Вы увидите общий балл и три домена с простыми объяснениями.",
      p4: "При желании получите PDF + советы по электронной почте."
    },
    buttons: {
      start: "Начать",
      method: "Узнать о методе",
      close: "Закрыть",
      next: "Далее",
      finish: "Завершить",
      previous: "Назад",
      pdf: "Получить мой PDF + советы",
      retake: "Повторить",
      share: "Поделиться",
      send: "Отправить PDF",
      back: "Вернуться к результатам"
    },
    method: {
      title: "О Копенгагенском инвентаре выгорания (CBI-19)",
      content: "Мы используем Копенгагенский инвентарь выгорания (CBI-19) с тремя доменами: Личное, Работа, Связанное с пациентами выгорание. Баллы варьируются от 0–100 (выше = больше выгорания)."
    },
    progress: "отвечено",
    terminology: "Терминология:",
    results: {
      headline: "Ваш индекс выгорания: {overall}% — {band}",
      blurb: "Более высокие баллы означают более высокий риск выгорания. Ваш паттерн предполагает:",
      personal: "Личное: {personal}% — {band}",
      work: "Работа: {work}% — {band}",
      patient: "Пациент: {patient}% — {band}",
      nextSteps: "Следующие шаги:",
      tips: {
        personal: "Приоритизируйте окна сна, микро-восстановление и снижение аллостатической нагрузки на этой неделе.",
        work: "Попробуйте эксперимент с границами (ограничение встреч, пакетная обработка) и 1:1 с вашим руководителем по нагрузке/ценностям.",
        patient: "Запланируйте debriefing/peer support; по возможности ротируйте требовательные кейсы; определите 'бюджет энергии' на день."
      }
    },
    email: {
      title: "Получите ваш персонализированный PDF отчет",
      description: "Введите email, чтобы получить подробный PDF с вашими баллами, интерпретациями и адаптированными советами по восстановлению.",
      consent: "Отправьте мне мой PDF и occasional исследовательские советы. Вы можете отписаться в любое время.",
      sent: "PDF скачан! Вы также можете отправить его себе по email."
    },
    bands: {
      low: "Низкая–Умеренная нагрузка",
      elevated: "Повышенная нагрузка",
      high: "Высокая нагрузка"
    }
  },
  pt: {
    // Portuguese translations (placeholders)
    title: "Verificação de Burnout — Autoavaliação de 2 minutos",
    sub: "Um instantâneo rápido e baseado em evidências da sua energia e tensão no trabalho.",
    note: "Isso não é um diagnóstico. Se estiver preocupado, fale com um profissional qualificado.",
    instructions: {
      p1: "Responda a todas as 19 declarações escolhendo o que se aplica a você recentemente.",
      p2: "Não há respostas certas/erradas. Seja honesto; é anônimo.",
      p3: "Você verá sua pontuação geral e três domínios com explicações simples.",
      p4: "Opcionalmente, obtenha PDF + dicas via email."
    },
    buttons: {
      start: "Começar",
      method: "Saiba sobre o método",
      close: "Fechar",
      next: "Próximo",
      finish: "Terminar",
      previous: "Anterior",
      pdf: "Obter meu PDF + dicas",
      retake: "Refazer",
      share: "Compartilhar",
      send: "Enviar PDF",
      back: "Voltar aos Resultados"
    },
    method: {
      title: "Sobre o Copenhagen Burnout Inventory (CBI-19)",
      content: "Usamos o Copenhagen Burnout Inventory (CBI-19) com três domínios: Pessoal, Trabalho, Relacionado a pacientes burnout. Pontuações variam de 0–100 (mais alto = mais burnout)."
    },
    progress: "respondido",
    terminology: "Terminologia:",
    results: {
      headline: "Seu Índice de Burnout: {overall}% — {band}",
      blurb: "Pontuações mais altas significam maior risco de burnout. Seu padrão sugere:",
      personal: "Pessoal: {personal}% — {band}",
      work: "Trabalho: {work}% — {band}",
      patient: "Paciente: {patient}% — {band}",
      nextSteps: "Próximos passos:",
      tips: {
        personal: "Priorize janelas de sono, micro-recuperação e redução da carga alostática esta semana.",
        work: "Teste um experimento de limite (tampa de reunião, loteamento) e um 1:1 com seu líder sobre carga/valores alinhamento.",
        patient: "Agende debriefings/suporte entre pares; gire casos exigentes quando possível; defina 'orçamento de energia' por dia."
      }
    },
    email: {
      title: "Obtenha seu Relatório PDF Personalizado",
      description: "Digite seu email para receber um PDF detalhado com suas pontuações, interpretações e dicas de recuperação personalizadas.",
      consent: "Envie-me meu PDF e dicas de pesquisa ocasionais. Você pode cancelar a inscrição a qualquer momento.",
      sent: "PDF baixado! Você também pode enviá-lo para si mesmo por email."
    },
    bands: {
      low: "Tensão Baixa–Moderada",
      elevated: "Tensão Elevada",
      high: "Tensão Alta"
    }
  }
};

// Current language (default to 'en')
let currentLang = 'en';

// Function to get translated text
function t(key, params = {}) {
  const keys = key.split('.');
  let value = i18n[currentLang];
  for (const k of keys) {
    value = value && value[k];
  }
  if (typeof value === 'string') {
    return Object.keys(params).reduce((str, param) => str.replace(`{${param}}`, params[param]), value);
  }
  return value || key;
}

// Function to set language
function setLanguage(lang) {
  if (i18n[lang]) {
    currentLang = lang;
    // Re-render UI if needed
    updateUI();
  }
}

// Function to update UI with current language
function updateUI() {
  // This would need to be called after DOM is ready and update all text elements
  // For now, it's a placeholder
  console.log('UI updated to language:', currentLang);
}