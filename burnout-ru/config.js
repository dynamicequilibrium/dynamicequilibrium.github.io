const config = {
  "title": "Burnout Check (CBI-19)",
  "response_scales": {
    "a": {"labels": ["Никогда / почти никогда","Редко","Иногда","Часто","Всегда"], "map":[0,25,50,75,100]},
    "b": {"labels": ["В очень низкой степени","В низкой степени","В некоторой степени","В высокой степени","В очень высокой степени"], "map":[0,25,50,75,100]}
  },
  "items": [
    {"id":1,"text":"Как часто вы чувствуете усталость?","domain":"personal","scale":"a","reverse":false},
    {"id":2,"text":"Как часто вы чувствуете физическое истощение?","domain":"personal","scale":"a","reverse":false},
    {"id":3,"text":"Как часто вы чувствуете эмоциональное истощение?","domain":"personal","scale":"a","reverse":false},
    {"id":4,"text":"Как часто вы думаете: \"Я больше не могу этого выносить\"?","domain":"personal","scale":"a","reverse":false},
    {"id":5,"text":"Как часто вы чувствуете себя изношенным?","domain":"personal","scale":"a","reverse":false},
    {"id":6,"text":"Как часто вы чувствуете слабость и подверженность болезням?","domain":"personal","scale":"a","reverse":false},

    {"id":7,"text":"Ваша работа эмоционально истощает вас?","domain":"work","scale":"b","reverse":false},
    {"id":8,"text":"Вы чувствуете выгорание из-за вашей работы?","domain":"work","scale":"b","reverse":false},
    {"id":9,"text":"Ваша работа вас разочаровывает?","domain":"work","scale":"b","reverse":false},
    {"id":10,"text":"Вы чувствуете себя изношенным в конце рабочего дня?","domain":"work","scale":"a","reverse":false},
    {"id":11,"text":"Вы чувствуете истощение утром при мысли о новом рабочем дне?","domain":"work","scale":"a","reverse":false},
    {"id":12,"text":"Вы чувствуете, что каждый рабочий час утомляет вас?","domain":"work","scale":"a","reverse":false},
    {"id":13,"text":"У вас достаточно энергии для семьи и друзей во время отдыха?","domain":"work","scale":"a","reverse":true},

    {"id":14,"text":"Вам трудно работать с клиентами?","domain":"patient","scale":"b","reverse":false},
    {"id":15,"text":"Вам трудно работать с клиентами?","domain":"patient","scale":"b","reverse":false},
    {"id":16,"text":"Работа с клиентами отнимает у вас энергию?","domain":"patient","scale":"b","reverse":false},
    {"id":17,"text":"Вы чувствуете, что отдаете больше, чем получаете, работая с клиентами?","domain":"patient","scale":"b","reverse":false},
    {"id":18,"text":"Вы устаете работать с клиентами?","domain":"patient","scale":"a","reverse":false},
    {"id":19,"text":"Как часто вы задумываетесь, а сможете ли вы дальше продолжать работать с клиентами?","domain":"patient","scale":"a","reverse":false}
  ],
  "bands": [
    {"min":0,"max":49.9,"label":"Низкая–умеренная нагрузка","color":"#22C55E"},
    {"min":50,"max":69.9,"label":"Повышенная нагрузка","color":"#F59E0B"},
    {"min":70,"max":100,"label":"Высокая нагрузка","color":"#EF4444"}
  ]
};