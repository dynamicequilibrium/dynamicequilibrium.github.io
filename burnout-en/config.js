const config = {
  "title": "Burnout Check (CBI-19)",
  "response_scales": {
    "a": {"labels": ["Never / almost never","Seldom","Sometimes","Often","Always"], "map":[0,25,50,75,100]},
    "b": {"labels": ["To a very low degree","To a low degree","Somewhat","To a high degree","To a very high degree"], "map":[0,25,50,75,100]}
  },
  "items": [
    {"id":1,"text":"How often do you feel tired?","domain":"personal","scale":"a","reverse":false},
    {"id":2,"text":"How often are you physically exhausted?","domain":"personal","scale":"a","reverse":false},
    {"id":3,"text":"How often are you emotionally exhausted?","domain":"personal","scale":"a","reverse":false},
    {"id":4,"text":"How often do you think: \"I can't take it anymore\"?","domain":"personal","scale":"a","reverse":false},
    {"id":5,"text":"How often do you feel worn out?","domain":"personal","scale":"a","reverse":false},
    {"id":6,"text":"How often do you feel weak and susceptible to illness?","domain":"personal","scale":"a","reverse":false},

    {"id":7,"text":"Is your work emotionally exhausting?","domain":"work","scale":"b","reverse":false},
    {"id":8,"text":"Do you feel burned out because of your work?","domain":"work","scale":"b","reverse":false},
    {"id":9,"text":"Does your work frustrate you?","domain":"work","scale":"b","reverse":false},
    {"id":10,"text":"Do you feel worn out at the end of the working day?","domain":"work","scale":"a","reverse":false},
    {"id":11,"text":"Are you exhausted in the morning at the thought of another day at work?","domain":"work","scale":"a","reverse":false},
    {"id":12,"text":"Do you feel that every working hour is tiring for you?","domain":"work","scale":"a","reverse":false},
    {"id":13,"text":"Do you have enough energy for family and friends during leisure time?","domain":"work","scale":"a","reverse":true},

    {"id":14,"text":"Do you find it hard to work with patients?","domain":"patient","scale":"b","reverse":false},
    {"id":15,"text":"Do you find it frustrating to work with patients?","domain":"patient","scale":"b","reverse":false},
    {"id":16,"text":"Does it drain your energy to work with patients?","domain":"patient","scale":"b","reverse":false},
    {"id":17,"text":"Do you feel that you give more than you get back when you work with patients?","domain":"patient","scale":"b","reverse":false},
    {"id":18,"text":"Are you tired of working with patients?","domain":"patient","scale":"a","reverse":false},
    {"id":19,"text":"Do you sometimes wonder how long you will be able to continue working with patients?","domain":"patient","scale":"a","reverse":false}
  ],
  "bands": [
    {"min":0,"max":49.9,"label":"Low–Moderate strain","color":"#22C55E"},
    {"min":50,"max":69.9,"label":"Elevated strain","color":"#F59E0B"},
    {"min":70,"max":100,"label":"High strain","color":"#EF4444"}
  ]
};