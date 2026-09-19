export const vitalRules = [

  // =========================
  // BLOOD PRESSURE SYSTOLIC
  // =========================

  {
    vital: "bp_systolic",
    label: "Blood Pressure",
    min: null,
    max: 89,
    status: "Low",
    severity: "medium",
    scorePenalty: 10,
    recommendationCode: "BP_LOW",
    priority: 5
  },

  {
    vital: "bp_systolic",
    label: "Blood Pressure",
    min: 90,
    max: 119,
    status: "Normal",
    severity: "normal",
    scorePenalty: 0,
    recommendationCode: "BP_NORMAL",
    priority: 1
  },

  {
    vital: "bp_systolic",
    label: "Blood Pressure",
    min: 120,
    max: 129,
    status: "Elevated",
    severity: "low",
    scorePenalty: 5,
    recommendationCode: "BP_ELEVATED",
    priority: 2
  },

  {
    vital: "bp_systolic",
    label: "Blood Pressure",
    min: 130,
    max: 139,
    status: "High",
    severity: "medium",
    scorePenalty: 10,
    recommendationCode: "BP_HIGH_1",
    priority: 3
  },

  {
    vital: "bp_systolic",
    label: "Blood Pressure",
    min: 140,
    max: 179,
    status: "High",
    severity: "high",
    scorePenalty: 20,
    recommendationCode: "BP_HIGH_2",
    priority: 4
  },

  {
    vital: "bp_systolic",
    label: "Blood Pressure",
    min: 180,
    max: null,
    status: "Critical",
    severity: "critical",
    scorePenalty: 35,
    recommendationCode: "BP_CRITICAL",
    priority: 10
  },


  // =========================
  // BLOOD PRESSURE DIASTOLIC
  // =========================

  {
    vital: "bp_diastolic",
    label: "Blood Pressure",
    min: null,
    max: 59,
    status: "Low",
    severity: "medium",
    scorePenalty: 10,
    recommendationCode: "BP_LOW",
    priority: 5
  },

  {
    vital: "bp_diastolic",
    label: "Blood Pressure",
    min: 60,
    max: 79,
    status: "Normal",
    severity: "normal",
    scorePenalty: 0,
    recommendationCode: "BP_NORMAL",
    priority: 1
  },

  {
    vital: "bp_diastolic",
    label: "Blood Pressure",
    min: 80,
    max: 89,
    status: "High",
    severity: "medium",
    scorePenalty: 10,
    recommendationCode: "BP_HIGH_1",
    priority: 3
  },

  {
    vital: "bp_diastolic",
    label: "Blood Pressure",
    min: 90,
    max: 119,
    status: "High",
    severity: "high",
    scorePenalty: 20,
    recommendationCode: "BP_HIGH_2",
    priority: 4
  },

  {
    vital: "bp_diastolic",
    label: "Blood Pressure",
    min: 120,
    max: null,
    status: "Critical",
    severity: "critical",
    scorePenalty: 35,
    recommendationCode: "BP_CRITICAL",
    priority: 10
  },


  // =========================
  // OXYGEN
  // =========================

  {
    vital: "oxygen",
    label: "Oxygen Level",
    min: 95,
    max: 100,
    status: "Normal",
    severity: "normal",
    scorePenalty: 0,
    recommendationCode: "OXYGEN_NORMAL",
    priority: 1
  },

  {
    vital: "oxygen",
    label: "Oxygen Level",
    min: 90,
    max: 94,
    status: "Low",
    severity: "medium",
    scorePenalty: 15,
    recommendationCode: "OXYGEN_LOW",
    priority: 5
  },

  {
    vital: "oxygen",
    label: "Oxygen Level",
    min: null,
    max: 89,
    status: "Critical",
    severity: "critical",
    scorePenalty: 35,
    recommendationCode: "OXYGEN_CRITICAL",
    priority: 10
  },


  // =========================
  // PULSE
  // =========================

  {
    vital: "heartbeat",
    label: "Pulse",
    min: null,
    max: 49,
    status: "Low",
    severity: "medium",
    scorePenalty: 10,
    recommendationCode: "PULSE_LOW",
    priority: 5
  },

  {
    vital: "heartbeat",
    label: "Pulse",
    min: 50,
    max: 100,
    status: "Normal",
    severity: "normal",
    scorePenalty: 0,
    recommendationCode: "PULSE_NORMAL",
    priority: 1
  },

  {
    vital: "heartbeat",
    label: "Pulse",
    min: 101,
    max: 130,
    status: "High",
    severity: "medium",
    scorePenalty: 10,
    recommendationCode: "PULSE_HIGH",
    priority: 5
  },

  {
    vital: "heartbeat",
    label: "Pulse",
    min: 131,
    max: null,
    status: "Very High",
    severity: "high",
    scorePenalty: 20,
    recommendationCode: "PULSE_HIGH",
    priority: 8
  },


  // =========================
  // TEMPERATURE
  // =========================

  {
    vital: "temperature",
    label: "Temperature",
    min: 97,
    max: 99,
    status: "Normal",
    severity: "normal",
    scorePenalty: 0,
    recommendationCode: "TEMP_NORMAL",
    priority: 1
  },

  {
    vital: "temperature",
    label: "Temperature",
    min: 99.1,
    max: 100.3,
    status: "Elevated",
    severity: "low",
    scorePenalty: 5,
    recommendationCode: "TEMP_ELEVATED",
    priority: 2
  },

  {
    vital: "temperature",
    label: "Temperature",
    min: 100.4,
    max: 103,
    status: "Fever",
    severity: "medium",
    scorePenalty: 15,
    recommendationCode: "TEMP_FEVER",
    priority: 5
  },

  {
    vital: "temperature",
    label: "Temperature",
    min: 103.1,
    max: null,
    status: "High Fever",
    severity: "high",
    scorePenalty: 25,
    recommendationCode: "TEMP_HIGH",
    priority: 8
  },


  // =========================
  // SUGAR
  // =========================

  {
    vital: "sugar",
    label: "Blood Sugar",
    min: null,
    max: 69,
    status: "Low",
    severity: "high",
    scorePenalty: 20,
    recommendationCode: "SUGAR_LOW",
    priority: 8
  },

  {
    vital: "sugar",
    label: "Blood Sugar",
    min: 70,
    max: 140,
    status: "Normal",
    severity: "normal",
    scorePenalty: 0,
    recommendationCode: "SUGAR_NORMAL",
    priority: 1
  },

  {
    vital: "sugar",
    label: "Blood Sugar",
    min: 141,
    max: 180,
    status: "Elevated",
    severity: "low",
    scorePenalty: 8,
    recommendationCode: "SUGAR_ELEVATED",
    priority: 3
  },

  {
    vital: "sugar",
    label: "Blood Sugar",
    min: 181,
    max: 250,
    status: "High",
    severity: "medium",
    scorePenalty: 15,
    recommendationCode: "SUGAR_HIGH",
    priority: 5
  },

  {
    vital: "sugar",
    label: "Blood Sugar",
    min: 251,
    max: null,
    status: "Very High",
    severity: "high",
    scorePenalty: 25,
    recommendationCode: "SUGAR_HIGH",
    priority: 8
  },


  // =========================
  // WEIGHT
  // =========================

  {
    vital: "weight",
    label: "Weight",
    min: 0,
    max: 500,
    status: "Tracked",
    severity: "normal",
    scorePenalty: 0,
    recommendationCode: "WEIGHT_STABLE",
    priority: 1
  }
];
