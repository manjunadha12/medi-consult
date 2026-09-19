import HealthLog from "../models/HealthLog.js";
import VitalRule from "../models/VitalRule.js";
import HealthRecommendation from "../models/HealthRecommendation.js";
import HealthCombinationRule from "../models/HealthCombinationRule.js";


/* =====================================================
   HELPERS
===================================================== */

const round = (value, decimals = 1) => {
  if (!Number.isFinite(Number(value))) return 0;

  return Number(Number(value).toFixed(decimals));
};


const average = (values) => {
  const valid = values
    .map(Number)
    .filter(Number.isFinite);

  if (!valid.length) return 0;

  return valid.reduce(
    (sum, value) => sum + value,
    0
  ) / valid.length;
};


const getTrend = (latest, previous) => {
  if (
    latest === null ||
    latest === undefined ||
    previous === null ||
    previous === undefined
  ) {
    return "stable";
  }

  const difference = latest - previous;

  const threshold = Math.max(
    Math.abs(previous) * 0.02,
    0.5
  );

  if (Math.abs(difference) <= threshold) {
    return "stable";
  }

  if (difference > 0) {
    return "increasing";
  }

  return "decreasing";
};


const getTrendIcon = (trend) => {
  if (trend === "increasing") return "↑";
  if (trend === "decreasing") return "↓";

  return "→";
};


const severityRank = {
  normal: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};


/* =====================================================
   FIND MATCHING DATABASE RULE
===================================================== */

const findRule = async (vital, value) => {

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const rules = await VitalRule.find({
    vital
  }).sort({
    priority: -1
  });

  for (const rule of rules) {

    const meetsMin =
      rule.min === null ||
      rule.min === undefined ||
      value >= rule.min;

    const meetsMax =
      rule.max === null ||
      rule.max === undefined ||
      value <= rule.max;

    if (meetsMin && meetsMax) {
      return rule;
    }
  }

  return null;
};


/* =====================================================
   ANALYZE ONE VITAL
===================================================== */

const analyzeVital = async ({
  vital,
  label,
  latest,
  previous,
  values,
  unit = ""
}) => {

  const validValues = values
    .map(Number)
    .filter(Number.isFinite);

  if (!validValues.length) {
    return {
      vital,
      label,
      latest: null,
      previous: null,
      average: 0,
      minimum: 0,
      maximum: 0,
      difference: 0,
      percentageChange: 0,
      trend: "stable",
      trendIcon: "→",
      status: "No Data",
      severity: "normal",
      unit,
      rule: null,
      recommendationCode: null
    };
  }

  const avg = round(average(validValues));

  const difference =
    previous !== null &&
    previous !== undefined
      ? round(latest - previous)
      : 0;

  const percentageChange =
    previous &&
    previous !== 0
      ? round(
          ((latest - previous) / previous) * 100
        )
      : 0;

  const trend = getTrend(
    latest,
    previous
  );

  const rule = await findRule(
    vital,
    latest
  );

  return {
    vital,

    label,

    latest: round(latest),

    previous:
      previous !== null &&
      previous !== undefined
        ? round(previous)
        : null,

    average: avg,

    minimum: round(
      Math.min(...validValues)
    ),

    maximum: round(
      Math.max(...validValues)
    ),

    difference,

    percentageChange,

    trend,

    trendIcon: getTrendIcon(trend),

    status:
      rule?.status || "Unknown",

    severity:
      rule?.severity || "normal",

    scorePenalty:
      rule?.scorePenalty || 0,

    recommendationCode:
      rule?.recommendationCode || null,

    normalRange: rule
      ? {
          min: rule.min,
          max: rule.max
        }
      : null,

    unit
  };
};


/* =====================================================
   ADD HEALTH LOG
===================================================== */

export const addHealthLog = async (
  req,
  res
) => {

  try {

    const {
      patientId,
      date,
      bp_systolic,
      bp_diastolic,
      temperature,
      heartbeat,
      sugar,
      oxygen,
      weight,
      notes
    } = req.body;


    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "patientId is required"
      });
    }


    const selectedDate =
      date
        ? new Date(date)
        : new Date();

    selectedDate.setHours(
      0,
      0,
      0,
      0
    );


    const nextDay =
      new Date(selectedDate);

    nextDay.setDate(
      nextDay.getDate() + 1
    );


    const existingLog =
      await HealthLog.findOne({
        patientId,

        date: {
          $gte: selectedDate,
          $lt: nextDay
        }
      });


    const healthData = {
      bp_systolic,
      bp_diastolic,
      temperature,
      heartbeat,
      sugar,
      oxygen,
      weight,
      notes
    };


    let log;

    if (existingLog) {

      Object.assign(
        existingLog,
        healthData
      );

      log =
        await existingLog.save();

    } else {

      log =
        await HealthLog.create({
          patientId,
          date: selectedDate,
          ...healthData
        });

    }


    return res.status(201).json({
      success: true,
      message: "Health log saved successfully",
      log
    });


  } catch (error) {

    console.error(
      "Add Health Log Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }

};


/* =====================================================
   GET HEALTH LOGS
===================================================== */

export const getHealthLogs = async (
  req,
  res
) => {

  try {

    const { patientId } =
      req.params;

    const {
      range = "week"
    } = req.query;


    let query = {
      patientId
    };


    const now =
      new Date();


    if (range === "week") {

      const start =
        new Date();

      start.setDate(
        now.getDate() - 7
      );

      query.date = {
        $gte: start
      };

    }


    if (range === "month") {

      const start =
        new Date();

      start.setDate(
        now.getDate() - 30
      );

      query.date = {
        $gte: start
      };

    }


    const logs =
      await HealthLog
        .find(query)
        .sort({
          date: 1
        });


    return res.json({
      success: true,
      range,
      count: logs.length,
      logs
    });


  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }

};


/* =====================================================
   COMPLETE LOCAL HEALTH ANALYSIS
===================================================== */

export const analyzeHealthTrends = async (
  req,
  res
) => {

  try {

    const {
      patientId,
      range = "week"
    } = req.body;


    if (!patientId) {

      return res.status(400).json({
        success: false,
        message: "patientId is required"
      });

    }


    let query = {
      patientId
    };


    const now =
      new Date();


    if (range === "week") {

      const start =
        new Date();

      start.setDate(
        now.getDate() - 7
      );

      query.date = {
        $gte: start
      };

    }


    if (range === "month") {

      const start =
        new Date();

      start.setDate(
        now.getDate() - 30
      );

      query.date = {
        $gte: start
      };

    }


    const logs =
      await HealthLog
        .find(query)
        .sort({
          date: 1
        })
        .lean();


    if (!logs.length) {

      return res.status(404).json({
        success: false,
        message:
          "No health records found"
      });

    }


    const latest =
      logs[logs.length - 1];


    const previous =
      logs.length > 1
        ? logs[logs.length - 2]
        : null;


    /* ============================
       ANALYZE ALL VITALS
    ============================ */

    const systolic =
      await analyzeVital({

        vital: "bp_systolic",

        label: "Blood Pressure Systolic",

        latest:
          latest.bp_systolic,

        previous:
          previous?.bp_systolic,

        values:
          logs.map(
            log => log.bp_systolic
          ),

        unit: "mmHg"
      });


    const diastolic =
      await analyzeVital({

        vital: "bp_diastolic",

        label: "Blood Pressure Diastolic",

        latest:
          latest.bp_diastolic,

        previous:
          previous?.bp_diastolic,

        values:
          logs.map(
            log => log.bp_diastolic
          ),

        unit: "mmHg"
      });


    const oxygen =
      await analyzeVital({

        vital: "oxygen",

        label: "Oxygen Level",

        latest:
          latest.oxygen,

        previous:
          previous?.oxygen,

        values:
          logs.map(
            log => log.oxygen
          ),

        unit: "%"
      });


    const pulse =
      await analyzeVital({

        vital: "heartbeat",

        label: "Pulse",

        latest:
          latest.heartbeat,

        previous:
          previous?.heartbeat,

        values:
          logs.map(
            log => log.heartbeat
          ),

        unit: "BPM"
      });


    const sugar =
      await analyzeVital({

        vital: "sugar",

        label: "Blood Sugar",

        latest:
          latest.sugar,

        previous:
          previous?.sugar,

        values:
          logs.map(
            log => log.sugar
          ),

        unit: "mg/dL"
      });


    const weight =
      await analyzeVital({

        vital: "weight",

        label: "Weight",

        latest:
          latest.weight,

        previous:
          previous?.weight,

        values:
          logs.map(
            log => log.weight
          ),

        unit: "kg"
      });


    const temperature =
      await analyzeVital({

        vital: "temperature",

        label: "Temperature",

        latest:
          latest.temperature,

        previous:
          previous?.temperature,

        values:
          logs.map(
            log => log.temperature
          ),

        unit: "°F"
      });


    /* ============================
       COMBINE BP
    ============================ */

    const bpSeverity =
      severityRank[
        systolic.severity
      ] >=
      severityRank[
        diastolic.severity
      ]
        ? systolic
        : diastolic;


    const bloodPressure = {

      label:
        "Blood Pressure",

      latest:
        `${systolic.latest}/${diastolic.latest}`,

      previous:
        systolic.previous !== null
          ? `${systolic.previous}/${diastolic.previous}`
          : null,

      average:
        `${systolic.average}/${diastolic.average}`,

      systolic,

      diastolic,

      status:
        bpSeverity.status,

      severity:
        bpSeverity.severity,

      scorePenalty:
        Math.max(
          systolic.scorePenalty,
          diastolic.scorePenalty
        ),

      recommendationCode:
        bpSeverity.recommendationCode,

      trend:

        systolic.trend ===
        diastolic.trend

          ? systolic.trend

          : "fluctuating"
    };


    /* ============================
       ALL VITALS
    ============================ */

    const vitals = {
      bloodPressure,
      oxygen,
      pulse,
      sugar,
      weight,
      temperature
    };


    /* ============================
       INCREASE / DECREASE / STABLE
    ============================ */

    const increasing = [];
    const decreasing = [];
    const stable = [];
    const fluctuating = [];


    const trendVitals = [

      {
        name:
          "Blood Pressure",

        trend:
          bloodPressure.trend
      },

      {
        name:
          "Oxygen",

        trend:
          oxygen.trend
      },

      {
        name:
          "Pulse",

        trend:
          pulse.trend
      },

      {
        name:
          "Blood Sugar",

        trend:
          sugar.trend
      },

      {
        name:
          "Weight",

        trend:
          weight.trend
      },

      {
        name:
          "Temperature",

        trend:
          temperature.trend
      }

    ];


    trendVitals.forEach(
      item => {

        if (
          item.trend ===
          "increasing"
        ) {
          increasing.push(
            item.name
          );
        }

        else if (
          item.trend ===
          "decreasing"
        ) {
          decreasing.push(
            item.name
          );
        }

        else if (
          item.trend ===
          "fluctuating"
        ) {
          fluctuating.push(
            item.name
          );
        }

        else {
          stable.push(
            item.name
          );
        }

      }
    );


    /* ============================
       HEALTH SCORE
    ============================ */

    const scoreItems = [

      bloodPressure,
      oxygen,
      pulse,
      sugar,
      temperature

    ];


    let totalPenalty = 0;


    scoreItems.forEach(
      item => {

        totalPenalty +=
          item.scorePenalty || 0;

      }
    );


    let healthScore =
      Math.max(
        0,
        100 - totalPenalty
      );


    /* ============================
       OVERALL STATUS
    ============================ */

    let overallStatus =
      "Excellent";

    let overallSeverity =
      "normal";


    const allAnalysis =
      Object.values(vitals);


    allAnalysis.forEach(
      item => {

        if (
          severityRank[
            item.severity
          ] >
          severityRank[
            overallSeverity
          ]
        ) {

          overallSeverity =
            item.severity;

        }

      }
    );


    if (
      overallSeverity ===
      "critical"
    ) {

      overallStatus =
        "Critical Attention";

    }

    else if (
      overallSeverity ===
      "high"
    ) {

      overallStatus =
        "Needs Medical Review";

    }

    else if (
      overallSeverity ===
      "medium"
    ) {

      overallStatus =
        "Needs Monitoring";

    }

    else if (
      overallSeverity ===
      "low"
    ) {

      overallStatus =
        "Minor Changes Detected";

    }


    /* ============================
       DATABASE RECOMMENDATIONS
    ============================ */

    const recommendationCodes =
      [
        bloodPressure.recommendationCode,
        oxygen.recommendationCode,
        pulse.recommendationCode,
        sugar.recommendationCode,
        temperature.recommendationCode,
        weight.recommendationCode
      ]
        .filter(Boolean);


    const recommendations =
      await HealthRecommendation
        .find({
          code: {
            $in:
              recommendationCodes
          }
        })
        .sort({
          priority: -1
        });


    /* ============================
       COMBINATION ANALYSIS
    ============================ */

    const combinationResults = [];
    try {
      const allCombinationRules = await HealthCombinationRule.find({}).lean();

      const currentTrends = {
        bloodPressure: bloodPressure.trend,
        oxygen: oxygen.trend,
        pulse: pulse.trend,
        sugar: sugar.trend,
        temperature: temperature.trend,
        weight: weight.trend,
        sleep: 8 // Mock or fetch from somewhere if available
      };

      for (const rule of allCombinationRules) {
        let match = true;
        for (const cond of rule.conditions) {
          const actualTrend = currentTrends[cond.vital];

          if (cond.trend) {
             if (actualTrend !== cond.trend) {
               match = false;
               break;
             }
          }

          if (cond.condition === "less_than" && cond.value !== null) {
             if (!(currentTrends[cond.vital] < cond.value)) {
               match = false;
               break;
             }
          }

          if (cond.condition === "greater_or_equal" && cond.value !== null) {
             if (!(currentTrends[cond.vital] >= cond.value)) {
               match = false;
               break;
             }
          }
        }

        if (match) {
          combinationResults.push(rule);
        }
      }
    } catch (combErr) {
      console.error("Combination Analysis Error:", combErr);
    }

    // Sort combinations by priority
    combinationResults.sort((a, b) => (b.priority || 0) - (a.priority || 0));


    /* ============================
       CHANGES
    ============================ */

    const changes = [];


    const addChange =
      (name, data) => {

        if (
          data.previous === null ||
          data.previous === undefined
        ) {
          return;
        }


        if (
          data.trend ===
          "increasing"
        ) {

          changes.push({
            vital: name,
            direction: "increasing",
            icon: "↑",
            difference:
              data.difference,
            message:
              `${name} increased by ${Math.abs(
                data.difference
              )} ${data.unit}`
          });

        }


        else if (
          data.trend ===
          "decreasing"
        ) {

          changes.push({
            vital: name,
            direction: "decreasing",
            icon: "↓",
            difference:
              data.difference,
            message:
              `${name} decreased by ${Math.abs(
                data.difference
              )} ${data.unit}`
          });

        }


        else {

          changes.push({
            vital: name,
            direction: "stable",
            icon: "→",
            difference: 0,
            message:
              `${name} remained stable`
          });

        }

      };


    addChange(
      "Oxygen",
      oxygen
    );

    addChange(
      "Pulse",
      pulse
    );

    addChange(
      "Blood Sugar",
      sugar
    );

    addChange(
      "Weight",
      weight
    );

    addChange(
      "Temperature",
      temperature
    );


    if (
      systolic.previous !== null
    ) {

      changes.unshift({

        vital:
          "Blood Pressure",

        direction:
          bloodPressure.trend,

        icon:

          bloodPressure.trend ===
          "increasing"

            ? "↑"

            : bloodPressure.trend ===
              "decreasing"

                ? "↓"

                : "→",

        difference:
          `${systolic.difference}/${diastolic.difference}`,

        message:

          `Blood Pressure changed from ` +

          `${bloodPressure.previous} ` +

          `to ${bloodPressure.latest}`

      });

    }


    /* ============================
       FINAL RESPONSE
    ============================ */

    return res.json({

      success: true,

      source:
        "LOCAL_DATABASE_HEALTH_ENGINE",

      aiUsed:
        false,

      patientId,

      reportDate:
        new Date(),

      period: {
        type: range,
        recordsAnalyzed:
          logs.length,

        firstRecord:
          logs[0].date,

        latestRecord:
          latest.date
      },


      overall: {

        healthScore,

        status:
          overallStatus,

        severity:
          overallSeverity,

        icon:

          overallSeverity ===
          "critical"

            ? "🔴"

            : overallSeverity ===
              "high"

                ? "🔴"

                : overallSeverity ===
                  "medium"

                    ? "🟡"

                    : "🟢"

      },


      summary: {

        increasing,

        decreasing,

        stable,

        fluctuating,

        totalVitals:
          trendVitals.length,

        totalRecords:
          logs.length

      },


      vitals,


      changes,


      recommendations,


      combinations: combinationResults,


      chartData:

        logs.map(
          log => ({

            date:
              log.date,

            bp_systolic:
              log.bp_systolic,

            bp_diastolic:
              log.bp_diastolic,

            oxygen:
              log.oxygen,

            pulse:
              log.heartbeat,

            sugar:
              log.sugar,

            weight:
              log.weight,

            temperature:
              log.temperature

          })
        )

    });


  } catch (error) {

    console.error(
      "Health Analysis Error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Health analysis failed",

      error:
        error.message

    });

  }

};


/* =====================================================
   CLEAN HEALTH DATA
===================================================== */

export const cleanHealthData =
  async (req, res) => {

    try {

      const {
        patientId
      } = req.params;


      const logs =
        await HealthLog
          .find({
            patientId
          })
          .sort({
            date: 1
          });


      const seenDates =
        new Set();

      const duplicateIds =
        [];


      let invalidValues =
        0;


      for (
        const log of logs
      ) {

        const dateKey =
          new Date(
            log.date
          )
            .toISOString()
            .split("T")[0];


        if (
          seenDates.has(
            dateKey
          )
        ) {

          duplicateIds.push(
            log._id
          );

          continue;

        }


        seenDates.add(
          dateKey
        );


        let changed =
          false;


        if (
          log.heartbeat &&
          (
            log.heartbeat < 30 ||
            log.heartbeat > 250
          )
        ) {

          log.heartbeat =
            null;

          changed = true;

          invalidValues++;

        }


        if (
          log.oxygen &&
          (
            log.oxygen < 50 ||
            log.oxygen > 100
          )
        ) {

          log.oxygen =
            null;

          changed = true;

          invalidValues++;

        }


        if (changed) {

          await log.save();

        }

      }


      if (
        duplicateIds.length
      ) {

        await HealthLog.deleteMany({

          _id: {
            $in:
              duplicateIds
          }

        });

      }


      return res.json({

        success: true,

        summary: {

          duplicatesRemoved:
            duplicateIds.length,

          invalidValuesRemoved:
            invalidValues,

          recordsProcessed:
            logs.length

        }

      });


    } catch (error) {

      return res.status(500).json({

        success: false,

        message:
          error.message

      });

    }

  };


/* =====================================================
   DELETE ALL HEALTH LOGS
===================================================== */

export const deleteAllHealthLogs =
  async (req, res) => {

    try {

      const {
        patientId
      } = req.params;


      const result =
        await HealthLog.deleteMany({
          patientId
        });


      return res.json({

        success: true,

        deletedCount:
          result.deletedCount,

        message:
          "All health records deleted"

      });


    } catch (error) {

      return res.status(500).json({

        success: false,

        message:
          error.message

      });

    }

  };
