export const healthCombinationRules = [

  // =========================================================
  // BLOOD PRESSURE + BLOOD SUGAR
  // =========================================================

  {
    code: "BP_UP_SUGAR_UP",
    name: "Blood Pressure Increasing + Blood Sugar Increasing",

    conditions: [
      { vital: "bloodPressure", trend: "increasing" },
      { vital: "sugar", trend: "increasing" }
    ],

    severity: "medium",
    priority: 9,

    title: "Blood Pressure and Blood Sugar are Increasing",

    analysis:
      "Blood pressure and blood sugar both increased during the selected monitoring period.",

    possibleAssociation:
      "These are important cardiometabolic measurements and are useful to monitor together. The recorded trend alone cannot establish that one caused the other.",

    precautions: [
      "Continue regular monitoring.",
      "Follow the prescribed healthcare plan.",
      "Maintain a consistent sleep schedule.",
      "Maintain appropriate physical activity when medically suitable.",
      "Avoid changing medication without professional advice.",
      "Discuss persistent abnormal trends with a healthcare professional."
    ],

    lifestyle: [
      "Maintain regular sleep.",
      "Keep meals consistent.",
      "Track weight regularly.",
      "Record BP and sugar at consistent times when possible."
    ]
  },


  {
    code: "BP_DOWN_SUGAR_DOWN",
    name: "Blood Pressure Decreasing + Blood Sugar Decreasing",

    conditions: [
      { vital: "bloodPressure", trend: "decreasing" },
      { vital: "sugar", trend: "decreasing" }
    ],

    severity: "normal",
    priority: 5,

    title: "Blood Pressure and Blood Sugar are Decreasing",

    analysis:
      "Both measurements decreased during the selected monitoring period.",

    possibleAssociation:
      "The measurements are moving downward together. The significance depends on the actual values and the patient's healthcare plan.",

    precautions: [
      "Continue monitoring.",
      "Do not intentionally lower medication doses without professional guidance.",
      "Watch for symptoms associated with unusually low readings."
    ],

    lifestyle: [
      "Continue consistent monitoring.",
      "Maintain regular meals and sleep."
    ]
  },


  {
    code: "BP_UP_SUGAR_STABLE",
    name: "Blood Pressure Increasing + Sugar Stable",

    conditions: [
      { vital: "bloodPressure", trend: "increasing" },
      { vital: "sugar", trend: "stable" }
    ],

    severity: "medium",
    priority: 6,

    title: "Blood Pressure is Increasing",

    analysis:
      "Blood pressure increased while blood sugar remained relatively stable.",

    precautions: [
      "Repeat abnormal BP readings.",
      "Monitor BP over subsequent days.",
      "Follow the prescribed BP management plan.",
      "Discuss repeated elevation with a healthcare professional."
    ]
  },


  {
    code: "BP_STABLE_SUGAR_UP",
    name: "Blood Pressure Stable + Sugar Increasing",

    conditions: [
      { vital: "bloodPressure", trend: "stable" },
      { vital: "sugar", trend: "increasing" }
    ],

    severity: "medium",
    priority: 6,

    title: "Blood Sugar is Increasing",

    analysis:
      "Blood sugar increased while blood pressure remained relatively stable.",

    precautions: [
      "Continue glucose monitoring.",
      "Follow the prescribed diabetes-care plan.",
      "Review repeated abnormal readings with a healthcare professional."
    ]
  },


  // =========================================================
  // BP + PULSE
  // =========================================================

  {
    code: "BP_UP_PULSE_UP",
    name: "Blood Pressure Increasing + Pulse Increasing",

    conditions: [
      { vital: "bloodPressure", trend: "increasing" },
      { vital: "pulse", trend: "increasing" }
    ],

    severity: "high",
    priority: 10,

    title: "Blood Pressure and Pulse are Increasing",

    analysis:
      "Blood pressure and pulse increased during the monitoring period.",

    possibleAssociation:
      "These cardiovascular measurements changed together. The pattern should be interpreted alongside actual readings, symptoms, activity and measurement conditions.",

    precautions: [
      "Rest before repeating measurements.",
      "Use correct measurement technique.",
      "Avoid interpreting a reading immediately after exercise as a resting value.",
      "Continue recording both BP and pulse.",
      "Seek medical guidance if repeated abnormal readings occur."
    ],

    lifestyle: [
      "Maintain consistent sleep.",
      "Avoid excessive stimulant intake.",
      "Maintain appropriate activity according to the healthcare plan."
    ]
  },


  {
    code: "BP_DOWN_PULSE_DOWN",
    name: "Blood Pressure Decreasing + Pulse Decreasing",

    conditions: [
      { vital: "bloodPressure", trend: "decreasing" },
      { vital: "pulse", trend: "decreasing" }
    ],

    severity: "normal",
    priority: 5,

    title: "Blood Pressure and Pulse are Decreasing",

    analysis:
      "Both cardiovascular measurements decreased during the selected period.",

    precautions: [
      "Continue monitoring.",
      "Check that readings remain within the configured reference ranges.",
      "Report unusually low readings or symptoms to a healthcare professional."
    ]
  },


  {
    code: "BP_UP_PULSE_STABLE",
    name: "Blood Pressure Increasing + Pulse Stable",

    conditions: [
      { vital: "bloodPressure", trend: "increasing" },
      { vital: "pulse", trend: "stable" }
    ],

    severity: "medium",
    priority: 6,

    title: "Blood Pressure is Increasing",

    analysis:
      "BP increased while pulse remained relatively stable.",

    precautions: [
      "Repeat BP measurements.",
      "Monitor the trend over several readings.",
      "Follow the prescribed healthcare plan."
    ]
  },


  // =========================================================
  // OXYGEN + PULSE
  // =========================================================

  {
    code: "O2_DOWN_PULSE_UP",
    name: "Oxygen Decreasing + Pulse Increasing",

    conditions: [
      { vital: "oxygen", trend: "decreasing" },
      { vital: "pulse", trend: "increasing" }
    ],

    severity: "high",
    priority: 10,

    title: "Oxygen is Decreasing While Pulse is Increasing",

    analysis:
      "Oxygen measurements decreased while pulse increased during the monitoring period.",

    possibleAssociation:
      "These measurements changed together and should be assessed alongside symptoms and measurement quality.",

    precautions: [
      "Repeat the oxygen measurement correctly.",
      "Ensure the sensor is positioned correctly.",
      "Rest and repeat the pulse measurement.",
      "Monitor for persistent abnormal readings.",
      "Seek prompt medical assessment if low oxygen readings persist or concerning symptoms occur."
    ]
  },


  {
    code: "O2_DOWN_PULSE_STABLE",
    name: "Oxygen Decreasing + Pulse Stable",

    conditions: [
      { vital: "oxygen", trend: "decreasing" },
      { vital: "pulse", trend: "stable" }
    ],

    severity: "medium",
    priority: 8,

    title: "Oxygen Level is Decreasing",

    analysis:
      "Oxygen measurements decreased while pulse remained relatively stable.",

    precautions: [
      "Repeat the measurement.",
      "Check sensor placement.",
      "Monitor subsequent readings.",
      "Seek medical guidance if low readings persist or symptoms occur."
    ]
  },


  {
    code: "O2_UP_PULSE_DOWN",
    name: "Oxygen Increasing + Pulse Decreasing",

    conditions: [
      { vital: "oxygen", trend: "increasing" },
      { vital: "pulse", trend: "decreasing" }
    ],

    severity: "normal",
    priority: 4,

    title: "Oxygen Improving and Pulse Decreasing",

    analysis:
      "Oxygen increased while pulse decreased during the monitoring period.",

    precautions: [
      "Continue monitoring.",
      "Maintain consistent measurement conditions."
    ]
  },


  // =========================================================
  // OXYGEN + TEMPERATURE
  // =========================================================

  {
    code: "O2_DOWN_TEMP_UP",
    name: "Oxygen Decreasing + Temperature Increasing",

    conditions: [
      { vital: "oxygen", trend: "decreasing" },
      { vital: "temperature", trend: "increasing" }
    ],

    severity: "high",
    priority: 10,

    title: "Oxygen Decreasing and Temperature Increasing",

    analysis:
      "Oxygen decreased while temperature increased.",

    possibleAssociation:
      "This combination may warrant closer monitoring, especially when accompanied by symptoms.",

    precautions: [
      "Repeat both measurements.",
      "Record associated symptoms.",
      "Monitor the trend closely.",
      "Seek medical evaluation when persistent abnormal readings or concerning symptoms occur."
    ]
  },


  {
    code: "O2_UP_TEMP_DOWN",
    name: "Oxygen Increasing + Temperature Decreasing",

    conditions: [
      { vital: "oxygen", trend: "increasing" },
      { vital: "temperature", trend: "decreasing" }
    ],

    severity: "normal",
    priority: 4,

    title: "Oxygen Improving and Temperature Decreasing",

    analysis:
      "Oxygen increased while temperature decreased.",

    precautions: [
      "Continue regular monitoring.",
      "Continue recording symptoms and measurements."
    ]
  },


  // =========================================================
  // TEMPERATURE + PULSE
  // =========================================================

  {
    code: "TEMP_UP_PULSE_UP",
    name: "Temperature Increasing + Pulse Increasing",

    conditions: [
      { vital: "temperature", trend: "increasing" },
      { vital: "pulse", trend: "increasing" }
    ],

    severity: "medium",
    priority: 8,

    title: "Temperature and Pulse are Increasing",

    analysis:
      "Temperature and pulse both increased during the monitoring period.",

    possibleAssociation:
      "Temperature changes can be accompanied by changes in heart rate, but the readings should be interpreted with symptoms and other health information.",

    precautions: [
      "Continue monitoring temperature and pulse.",
      "Maintain appropriate fluid intake unless medically restricted.",
      "Record symptoms.",
      "Seek medical advice if worsening or persistent abnormal readings occur."
    ]
  },


  {
    code: "TEMP_DOWN_PULSE_DOWN",
    name: "Temperature Decreasing + Pulse Decreasing",

    conditions: [
      { vital: "temperature", trend: "decreasing" },
      { vital: "pulse", trend: "decreasing" }
    ],

    severity: "normal",
    priority: 4,

    title: "Temperature and Pulse are Decreasing",

    analysis:
      "Temperature and pulse decreased together.",

    precautions: [
      "Continue routine monitoring.",
      "Record any new symptoms."
    ]
  },


  // =========================================================
  // SUGAR + WEIGHT
  // =========================================================

  {
    code: "SUGAR_UP_WEIGHT_UP",
    name: "Blood Sugar Increasing + Weight Increasing",

    conditions: [
      { vital: "sugar", trend: "increasing" },
      { vital: "weight", trend: "increasing" }
    ],

    severity: "medium",
    priority: 8,

    title: "Blood Sugar and Weight are Increasing",

    analysis:
      "Both blood sugar and weight increased during the selected period.",

    possibleAssociation:
      "These measurements can be useful to monitor together as part of a broader metabolic health picture. The trend does not establish causation.",

    precautions: [
      "Continue tracking both measurements.",
      "Maintain a consistent eating pattern.",
      "Follow the prescribed healthcare plan.",
      "Discuss persistent changes with a healthcare professional."
    ],

    lifestyle: [
      "Maintain regular sleep.",
      "Maintain appropriate physical activity.",
      "Track food and weight consistently."
    ]
  },


  {
    code: "SUGAR_DOWN_WEIGHT_DOWN",
    name: "Blood Sugar Decreasing + Weight Decreasing",

    conditions: [
      { vital: "sugar", trend: "decreasing" },
      { vital: "weight", trend: "decreasing" }
    ],

    severity: "normal",
    priority: 4,

    title: "Blood Sugar and Weight are Decreasing",

    analysis:
      "Both measurements decreased during the selected period.",

    precautions: [
      "Continue monitoring.",
      "Ensure weight changes are intentional and consistent with the healthcare plan.",
      "Discuss unexplained weight loss with a healthcare professional."
    ]
  },


  {
    code: "SUGAR_UP_WEIGHT_STABLE",
    name: "Sugar Increasing + Weight Stable",

    conditions: [
      { vital: "sugar", trend: "increasing" },
      { vital: "weight", trend: "stable" }
    ],

    severity: "medium",
    priority: 6,

    title: "Blood Sugar is Increasing",

    analysis:
      "Blood sugar increased while weight remained relatively stable.",

    precautions: [
      "Continue glucose monitoring.",
      "Follow the prescribed healthcare plan.",
      "Discuss repeated elevated readings with a healthcare professional."
    ]
  },


  // =========================================================
  // SLEEP + BP
  // =========================================================

  {
    code: "SLEEP_LOW_BP_UP",
    name: "Insufficient Sleep + Blood Pressure Increasing",

    conditions: [
      {
        vital: "sleep",
        condition: "less_than",
        value: 7
      },
      {
        vital: "bloodPressure",
        trend: "increasing"
      }
    ],

    severity: "medium",
    priority: 8,

    title: "Short Sleep and Increasing Blood Pressure",

    analysis:
      "Recorded sleep duration was below the configured adult sleep target while blood pressure increased.",

    possibleAssociation:
      "Insufficient sleep is associated with cardiovascular and metabolic health risks, but this dataset cannot determine that reduced sleep caused the BP change.",

    precautions: [
      "Aim for adequate sleep.",
      "Maintain a consistent bedtime and wake time.",
      "Monitor BP regularly.",
      "Discuss persistent BP elevation with a healthcare professional."
    ],

    sleepRecommendation: {
      targetHoursMin: 7,
      targetHoursMax: 9,
      advice:
        "Aim for approximately 7–9 hours of sleep and maintain a consistent sleep schedule."
    }
  },


  {
    code: "SLEEP_LOW_SUGAR_UP",
    name: "Insufficient Sleep + Blood Sugar Increasing",

    conditions: [
      {
        vital: "sleep",
        condition: "less_than",
        value: 7
      },
      {
        vital: "sugar",
        trend: "increasing"
      }
    ],

    severity: "medium",
    priority: 8,

    title: "Short Sleep and Increasing Blood Sugar",

    analysis:
      "Sleep duration was below the configured target while blood sugar increased.",

    possibleAssociation:
      "Insufficient sleep can be associated with poorer metabolic health, but the recorded data cannot establish causation.",

    precautions: [
      "Aim for adequate sleep.",
      "Maintain consistent sleep and wake times.",
      "Continue glucose monitoring.",
      "Follow the prescribed healthcare plan."
    ],

    sleepRecommendation: {
      targetHoursMin: 7,
      targetHoursMax: 9
    }
  },


  {
    code: "SLEEP_LOW_BP_SUGAR_UP",
    name: "Insufficient Sleep + BP Increasing + Sugar Increasing",

    conditions: [
      {
        vital: "sleep",
        condition: "less_than",
        value: 7
      },
      {
        vital: "bloodPressure",
        trend: "increasing"
      },
      {
        vital: "sugar",
        trend: "increasing"
      }
    ],

    severity: "high",
    priority: 10,

    title: "Short Sleep with Increasing BP and Blood Sugar",

    analysis:
      "Short sleep duration was recorded together with increasing blood pressure and blood sugar.",

    possibleAssociation:
      "This is a multi-factor monitoring pattern involving sleep and cardiometabolic measurements. It should not be interpreted as proof that sleep caused the vital changes.",

    precautions: [
      "Prioritize a consistent sleep schedule.",
      "Aim for approximately 7–9 hours of sleep.",
      "Continue monitoring BP and blood sugar.",
      "Follow the existing healthcare plan.",
      "Discuss persistent worsening trends with a healthcare professional."
    ],

    sleepRecommendation: {
      targetHoursMin: 7,
      targetHoursMax: 9,
      bedtimeAdvice:
        "Choose a bedtime that allows approximately 7–9 hours before the planned wake time."
    }
  },


  // =========================================================
  // SLEEP + PULSE
  // =========================================================

  {
    code: "SLEEP_LOW_PULSE_UP",
    name: "Insufficient Sleep + Pulse Increasing",

    conditions: [
      {
        vital: "sleep",
        condition: "less_than",
        value: 7
      },
      {
        vital: "pulse",
        trend: "increasing"
      }
    ],

    severity: "medium",
    priority: 7,

    title: "Short Sleep and Increasing Pulse",

    analysis:
      "Sleep duration was below the configured target while pulse increased.",

    precautions: [
      "Prioritize adequate sleep.",
      "Rest before checking pulse.",
      "Record pulse under consistent conditions.",
      "Discuss persistent abnormal resting pulse with a healthcare professional."
    ]
  },


  // =========================================================
  // SLEEP + WEIGHT
  // =========================================================

  {
    code: "SLEEP_LOW_WEIGHT_UP",
    name: "Insufficient Sleep + Weight Increasing",

    conditions: [
      {
        vital: "sleep",
        condition: "less_than",
        value: 7
      },
      {
        vital: "weight",
        trend: "increasing"
      }
    ],

    severity: "medium",
    priority: 6,

    title: "Short Sleep and Increasing Weight",

    analysis:
      "Sleep duration was below the configured target while weight increased.",

    precautions: [
      "Maintain regular sleep.",
      "Track weight consistently.",
      "Maintain appropriate physical activity.",
      "Review persistent changes with a healthcare professional."
    ]
  },


  // =========================================================
  // THREE-VITAL COMBINATIONS
  // =========================================================

  {
    code: "BP_SUGAR_PULSE_UP",
    name: "BP + Sugar + Pulse Increasing",

    conditions: [
      {
        vital: "bloodPressure",
        trend: "increasing"
      },
      {
        vital: "sugar",
        trend: "increasing"
      },
      {
        vital: "pulse",
        trend: "increasing"
      }
    ],

    severity: "high",
    priority: 10,

    title: "Multiple Cardiometabolic Measurements Increasing",

    analysis:
      "Blood pressure, blood sugar and pulse all increased during the monitoring period.",

    possibleAssociation:
      "Several cardiovascular and metabolic measurements are moving upward together. This is a monitoring signal, not a diagnosis.",

    precautions: [
      "Repeat abnormal measurements.",
      "Use consistent measurement conditions.",
      "Continue monitoring all three measurements.",
      "Follow the prescribed healthcare plan.",
      "Arrange professional review if the pattern persists."
    ]
  },


  {
    code: "O2_PULSE_TEMP_RISK",
    name: "Oxygen Decreasing + Pulse Increasing + Temperature Increasing",

    conditions: [
      {
        vital: "oxygen",
        trend: "decreasing"
      },
      {
        vital: "pulse",
        trend: "increasing"
      },
      {
        vital: "temperature",
        trend: "increasing"
      }
    ],

    severity: "critical",
    priority: 10,

    title: "Multiple Respiratory/Temperature Measurements Changing",

    analysis:
      "Oxygen decreased while pulse and temperature increased.",

    possibleAssociation:
      "This combination may indicate a need for prompt clinical assessment, particularly when symptoms are present.",

    precautions: [
      "Repeat the measurements.",
      "Check measurement technique.",
      "Monitor symptoms.",
      "Do not rely solely on the application score.",
      "Seek prompt medical assessment when abnormal readings persist or concerning symptoms occur."
    ]
  },


  {
    code: "BP_O2_PULSE_RISK",
    name: "Blood Pressure Increasing + Oxygen Decreasing + Pulse Increasing",

    conditions: [
      {
        vital: "bloodPressure",
        trend: "increasing"
      },
      {
        vital: "oxygen",
        trend: "decreasing"
      },
      {
        vital: "pulse",
        trend: "increasing"
      }
    ],

    severity: "critical",
    priority: 10,

    title: "Multiple Vital Signs Worsening",

    analysis:
      "Blood pressure and pulse increased while oxygen decreased.",

    possibleAssociation:
      "Several vital-sign trends are changing simultaneously and warrant closer attention.",

    precautions: [
      "Repeat all measurements.",
      "Ensure measurements are taken correctly.",
      "Check for symptoms.",
      "Do not ignore persistent abnormal readings.",
      "Seek prompt medical evaluation when appropriate."
    ]
  },


  {
    code: "SUGAR_WEIGHT_BP_UP",
    name: "Sugar + Weight + Blood Pressure Increasing",

    conditions: [
      {
        vital: "sugar",
        trend: "increasing"
      },
      {
        vital: "weight",
        trend: "increasing"
      },
      {
        vital: "bloodPressure",
        trend: "increasing"
      }
    ],

    severity: "high",
    priority: 10,

    title: "Multiple Cardiometabolic Trends Increasing",

    analysis:
      "Blood sugar, weight and blood pressure all increased during the monitoring period.",

    possibleAssociation:
      "These measurements can be considered together when reviewing longer-term cardiometabolic trends.",

    precautions: [
      "Continue tracking all three measurements.",
      "Maintain regular sleep.",
      "Follow the prescribed nutrition and healthcare plan.",
      "Maintain suitable physical activity.",
      "Discuss persistent changes with a healthcare professional."
    ]
  },


  // =========================================================
  // FOUR-VITAL PATTERN
  // =========================================================

  {
    code: "MULTIPLE_VITALS_WORSENING",
    name: "Multiple Vital Signs Worsening",

    conditions: [
      {
        vital: "bloodPressure",
        trend: "increasing"
      },
      {
        vital: "sugar",
        trend: "increasing"
      },
      {
        vital: "pulse",
        trend: "increasing"
      },
      {
        vital: "oxygen",
        trend: "decreasing"
      }
    ],

    severity: "critical",
    priority: 10,

    title: "Multiple Vital Signs Show Worsening Trends",

    analysis:
      "Multiple recorded vital signs changed in potentially concerning directions during the monitoring period.",

    precautions: [
      "Repeat abnormal measurements.",
      "Verify measurement technique.",
      "Review the complete health history.",
      "Monitor for symptoms.",
      "Seek medical assessment when persistent abnormalities or concerning symptoms occur."
    ]
  },


  // =========================================================
  // ALL STABLE
  // =========================================================

  {
    code: "ALL_VITALS_STABLE",
    name: "All Monitored Vitals Stable",

    conditions: [
      {
        vital: "bloodPressure",
        trend: "stable"
      },
      {
        vital: "sugar",
        trend: "stable"
      },
      {
        vital: "oxygen",
        trend: "stable"
      },
      {
        vital: "pulse",
        trend: "stable"
      },
      {
        vital: "temperature",
        trend: "stable"
      },
      {
        vital: "weight",
        trend: "stable"
      }
    ],

    severity: "normal",
    priority: 10,

    title: "Vitals are Relatively Stable",

    analysis:
      "No major directional changes were detected across the monitored vitals.",

    precautions: [
      "Continue regular monitoring.",
      "Maintain a consistent routine.",
      "Continue recording health data."
    ],

    lifestyle: [
      "Maintain regular sleep.",
      "Maintain appropriate physical activity.",
      "Continue the existing healthcare plan."
    ]
  },


  // =========================================================
  // ONE VITAL IMPROVING
  // =========================================================

  {
    code: "O2_IMPROVING",
    name: "Oxygen Improving",

    conditions: [
      {
        vital: "oxygen",
        trend: "increasing"
      }
    ],

    severity: "normal",
    priority: 3,

    title: "Oxygen Trend is Improving",

    analysis:
      "Oxygen readings increased compared with previous readings.",

    precautions: [
      "Continue monitoring.",
      "Maintain consistent measurement conditions."
    ]
  },


  {
    code: "BP_IMPROVING",
    name: "Blood Pressure Decreasing",

    conditions: [
      {
        vital: "bloodPressure",
        trend: "decreasing"
      }
    ],

    severity: "normal",
    priority: 3,

    title: "Blood Pressure Trend is Decreasing",

    analysis:
      "Blood pressure decreased compared with previous readings.",

    precautions: [
      "Continue monitoring.",
      "Ensure readings do not become unusually low.",
      "Continue following the healthcare plan."
    ]
  },


  {
    code: "SUGAR_IMPROVING",
    name: "Blood Sugar Decreasing",

    conditions: [
      {
        vital: "sugar",
        trend: "decreasing"
      }
    ],

    severity: "normal",
    priority: 3,

    title: "Blood Sugar Trend is Decreasing",

    analysis:
      "Blood sugar decreased compared with previous readings.",

    precautions: [
      "Continue monitoring.",
      "Ensure values do not become unusually low.",
      "Continue following the prescribed healthcare plan."
    ]
  },


  // =========================================================
  // WEIGHT
  // =========================================================

  {
    code: "WEIGHT_UP",
    name: "Weight Increasing",

    conditions: [
      {
        vital: "weight",
        trend: "increasing"
      }
    ],

    severity: "low",
    priority: 4,

    title: "Weight is Increasing",

    analysis:
      "Weight increased compared with the previous measurement.",

    precautions: [
      "Continue consistent weight tracking.",
      "Review longer-term weight trends rather than a single measurement.",
      "Discuss unexplained or rapid changes with a healthcare professional."
    ]
  },


  {
    code: "WEIGHT_DOWN",
    name: "Weight Decreasing",

    conditions: [
      {
        vital: "weight",
        trend: "decreasing"
      }
    ],

    severity: "normal",
    priority: 3,

    title: "Weight is Decreasing",

    analysis:
      "Weight decreased compared with the previous measurement.",

    precautions: [
      "Continue tracking weight.",
      "Discuss unexplained or rapid weight loss with a healthcare professional."
    ]
  },


  // =========================================================
  // SLEEP GOOD
  // =========================================================

  {
    code: "SLEEP_GOOD_ALL_STABLE",
    name: "Adequate Sleep + Stable Vitals",

    conditions: [
      {
        vital: "sleep",
        condition: "greater_or_equal",
        value: 7
      },
      {
        vital: "bloodPressure",
        trend: "stable"
      },
      {
        vital: "sugar",
        trend: "stable"
      }
    ],

    severity: "normal",
    priority: 5,

    title: "Sleep and Monitored Trends are Stable",

    analysis:
      "Recorded sleep duration meets the configured target while BP and sugar remain relatively stable.",

    precautions: [
      "Continue the current sleep routine.",
      "Continue regular health monitoring."
    ],

    sleepRecommendation: {
      targetHoursMin: 7,
      targetHoursMax: 9
    }
  },


  // =========================================================
  // POOR SLEEP MULTIPLE VITALS
  // =========================================================

  {
    code: "POOR_SLEEP_MULTIPLE_RISK",
    name: "Short Sleep + Multiple Worsening Vitals",

    conditions: [
      {
        vital: "sleep",
        condition: "less_than",
        value: 7
      },
      {
        vital: "bloodPressure",
        trend: "increasing"
      },
      {
        vital: "sugar",
        trend: "increasing"
      },
      {
        vital: "pulse",
        trend: "increasing"
      }
    ],

    severity: "high",
    priority: 10,

    title: "Short Sleep with Multiple Increasing Vitals",

    analysis:
      "Short sleep was recorded together with increasing blood pressure, blood sugar and pulse.",

    possibleAssociation:
      "Sleep duration is one factor that can be considered when reviewing cardiovascular and metabolic trends. This pattern does not prove causation.",

    precautions: [
      "Prioritize regular sleep.",
      "Aim for approximately 7–9 hours.",
      "Maintain a consistent bedtime and wake time.",
      "Continue monitoring BP, sugar and pulse.",
      "Discuss persistent worsening trends with a healthcare professional."
    ],

    sleepRecommendation: {
      targetHoursMin: 7,
      targetHoursMax: 9
    }
  }

];
