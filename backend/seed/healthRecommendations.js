export const healthRecommendations = [

  {
    code: "BP_LOW",
    vital: "Blood Pressure",
    title: "Blood Pressure is Low",
    message:
      "Monitor your blood pressure and discuss repeated low readings or symptoms with a healthcare professional.",
    severity: "medium",
    priority: 5
  },

  {
    code: "BP_NORMAL",
    vital: "Blood Pressure",
    title: "Blood Pressure is Within the Configured Range",
    message:
      "Continue recording blood pressure regularly to monitor long-term trends.",
    severity: "normal",
    priority: 1
  },

  {
    code: "BP_ELEVATED",
    vital: "Blood Pressure",
    title: "Blood Pressure is Elevated",
    message:
      "Continue monitoring future readings and discuss persistent elevation with a healthcare professional.",
    severity: "low",
    priority: 3
  },

  {
    code: "BP_HIGH_1",
    vital: "Blood Pressure",
    title: "Blood Pressure Needs Monitoring",
    message:
      "Track repeated readings and follow the care plan provided by your healthcare professional.",
    severity: "medium",
    priority: 5
  },

  {
    code: "BP_HIGH_2",
    vital: "Blood Pressure",
    title: "High Blood Pressure Detected",
    message:
      "Repeated high readings should be reviewed by a healthcare professional.",
    severity: "high",
    priority: 8
  },

  {
    code: "BP_CRITICAL",
    vital: "Blood Pressure",
    title: "Critical Blood Pressure Range",
    message:
      "Repeat the measurement correctly. Seek urgent medical guidance if the reading persists or concerning symptoms are present.",
    severity: "critical",
    priority: 10
  },


  {
    code: "OXYGEN_NORMAL",
    vital: "Oxygen",
    title: "Oxygen Level is Within the Configured Range",
    message:
      "Continue regular monitoring and maintain consistent health logging.",
    severity: "normal",
    priority: 1
  },

  {
    code: "OXYGEN_LOW",
    vital: "Oxygen",
    title: "Oxygen Level Needs Attention",
    message:
      "Recheck the reading and monitor for persistent low values or symptoms.",
    severity: "medium",
    priority: 8
  },

  {
    code: "OXYGEN_CRITICAL",
    vital: "Oxygen",
    title: "Very Low Oxygen Reading",
    message:
      "Repeat the measurement and seek prompt medical evaluation if the low reading persists or symptoms are present.",
    severity: "critical",
    priority: 10
  },


  {
    code: "PULSE_LOW",
    vital: "Pulse",
    title: "Pulse is Low",
    message:
      "Recheck the pulse and monitor persistent unusual readings.",
    severity: "medium",
    priority: 5
  },

  {
    code: "PULSE_NORMAL",
    vital: "Pulse",
    title: "Pulse is Within the Configured Range",
    message:
      "Continue regular monitoring.",
    severity: "normal",
    priority: 1
  },

  {
    code: "PULSE_HIGH",
    vital: "Pulse",
    title: "Pulse is Elevated",
    message:
      "Rest and recheck the pulse. Monitor repeated abnormal readings.",
    severity: "medium",
    priority: 6
  },


  {
    code: "TEMP_NORMAL",
    vital: "Temperature",
    title: "Temperature is Within the Configured Range",
    message:
      "Continue routine health monitoring.",
    severity: "normal",
    priority: 1
  },

  {
    code: "TEMP_ELEVATED",
    vital: "Temperature",
    title: "Temperature is Elevated",
    message:
      "Monitor future readings and record any associated symptoms.",
    severity: "low",
    priority: 3
  },

  {
    code: "TEMP_FEVER",
    vital: "Temperature",
    title: "Fever Range Detected",
    message:
      "Continue monitoring and follow medical advice based on your symptoms and healthcare plan.",
    severity: "medium",
    priority: 6
  },

  {
    code: "TEMP_HIGH",
    vital: "Temperature",
    title: "High Temperature Detected",
    message:
      "Monitor closely and seek medical guidance if the reading persists or concerning symptoms occur.",
    severity: "high",
    priority: 8
  },


  {
    code: "SUGAR_LOW",
    vital: "Blood Sugar",
    title: "Low Blood Sugar",
    message:
      "Follow your prescribed low-blood-sugar management plan and recheck the reading.",
    severity: "high",
    priority: 8
  },

  {
    code: "SUGAR_NORMAL",
    vital: "Blood Sugar",
    title: "Blood Sugar is Within the Configured Range",
    message:
      "Continue regular monitoring according to your healthcare plan.",
    severity: "normal",
    priority: 1
  },

  {
    code: "SUGAR_ELEVATED",
    vital: "Blood Sugar",
    title: "Blood Sugar is Elevated",
    message:
      "Continue monitoring and follow your prescribed care plan.",
    severity: "low",
    priority: 4
  },

  {
    code: "SUGAR_HIGH",
    vital: "Blood Sugar",
    title: "High Blood Sugar Reading",
    message:
      "Monitor repeated readings and follow your prescribed diabetes-care plan.",
    severity: "medium",
    priority: 7
  },


  {
    code: "WEIGHT_STABLE",
    vital: "Weight",
    title: "Weight Trend",
    message:
      "Continue recording weight consistently to identify long-term changes.",
    severity: "normal",
    priority: 1
  }
];
