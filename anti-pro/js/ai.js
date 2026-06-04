/* ═══════════════════════════════════════════════════════
   WealthWise — AI Engine
   ai.js
═══════════════════════════════════════════════════════ */

const AI = (() => {

  /* ── Linear Regression (least squares) ── */
  const linearRegression = (values) => {
    const n = values.length;
    if (n < 2) return values[n - 1] || 0;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    values.forEach((y, x) => {
      sumX  += x;
      sumY  += y;
      sumXY += x * y;
      sumX2 += x * x;
    });
    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    return m * n + b;
  };

  /* ── Expense Prediction (next month) ── */
  const predictNextMonthExpense = (userId) => {
    const monthly = Store.getMonthlyData(userId, 6);
    const expenses = monthly.map(m => m.expense);
    const predicted = Math.max(0, linearRegression(expenses));
    const lastMonth = expenses[expenses.length - 1] || 0;
    const trend = predicted - lastMonth;
    return {
      predicted: Math.round(predicted),
      trend: Math.round(trend),
      trendPct: lastMonth ? Math.round((trend / lastMonth) * 100) : 0,
      monthly,
    };
  };

  /* ── Savings Forecast ── */
  const forecastSavings = (userId, months = 12) => {
    const monthly = Store.getMonthlyData(userId, 6);
    const savings = monthly.map(m => m.savings).filter(s => s > 0);
    const avgSavings = savings.length
      ? savings.reduce((a, b) => a + b, 0) / savings.length
      : 0;
    const forecast = [];
    const now = new Date();
    let cumulative = Store.getSummary(userId).totalSavings;
    for (let i = 1; i <= months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      cumulative += avgSavings;
      forecast.push({
        label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        amount: Math.max(0, Math.round(cumulative)),
      });
    }
    return { forecast, avgMonthlySavings: Math.round(avgSavings) };
  };

  /* ── Budget Recommendation (50/30/20 rule) ── */
  const getBudgetRecommendations = (userId) => {
    const monthly = Store.getMonthlyData(userId, 3);
    const avgIncome = monthly.reduce((s, m) => s + m.income, 0) / monthly.length || 0;
    if (!avgIncome) return null;

    const needs   = avgIncome * 0.50;  // Rent, Bills, Food
    const wants   = avgIncome * 0.30;  // Shopping, Entertainment
    const savings = avgIncome * 0.20;  // Savings/Goals

    const catBreakdown = Store.getCategoryBreakdown(userId, 'expense', 3);
    const avgCat = {};
    Object.entries(catBreakdown).forEach(([k, v]) => avgCat[k] = v / 3);

    const needsCats  = ['Bills', 'Food', 'Health', 'Transport'];
    const wantsCats  = ['Shopping', 'Entertainment', 'Others'];

    const actualNeeds  = needsCats.reduce((s, c) => s + (avgCat[c] || 0), 0);
    const actualWants  = wantsCats.reduce((s, c) => s + (avgCat[c] || 0), 0);
    const actualSaving = avgIncome - actualNeeds - actualWants;

    return {
      avgIncome: Math.round(avgIncome),
      recommended: {
        needs:   Math.round(needs),
        wants:   Math.round(wants),
        savings: Math.round(savings),
      },
      actual: {
        needs:   Math.round(actualNeeds),
        wants:   Math.round(actualWants),
        savings: Math.round(actualSaving),
      },
      pct: {
        needs:   Math.round((actualNeeds / avgIncome) * 100),
        wants:   Math.round((actualWants / avgIncome) * 100),
        savings: Math.round((actualSaving / avgIncome) * 100),
      },
    };
  };

  /* ── Spending Insights (compared to last month) ── */
  const getSpendingInsights = (userId) => {
    const monthly = Store.getMonthlyData(userId, 2);
    if (monthly.length < 2) return [];

    const curr = monthly[monthly.length - 1];
    const prev = monthly[monthly.length - 2];
    const insights = [];
    const currency = Store.getSettings().currency || '₹';

    // Overall spending change
    if (prev.expense > 0) {
      const change = ((curr.expense - prev.expense) / prev.expense) * 100;
      if (change > 10) {
        insights.push({
          icon: '⚠️',
          type: 'warning',
          text: `Your spending increased by <strong>${Math.abs(Math.round(change))}%</strong> compared to last month. Consider reviewing discretionary expenses.`,
        });
      } else if (change < -10) {
        insights.push({
          icon: '🎉',
          type: 'success',
          text: `Great job! You reduced spending by <strong>${Math.abs(Math.round(change))}%</strong> this month, saving an extra <strong>${currency}${(prev.expense - curr.expense).toLocaleString('en-IN')}</strong>!`,
        });
      } else {
        insights.push({
          icon: '👍',
          type: 'info',
          text: `Spending is stable this month. You're within <strong>${Math.abs(Math.round(change))}%</strong> of last month's level.`,
        });
      }
    }

    // Savings rate
    if (curr.income > 0) {
      const savingsRate = Math.round((curr.savings / curr.income) * 100);
      if (savingsRate >= 20) {
        insights.push({
          icon: '💰',
          type: 'success',
          text: `Excellent! Your savings rate is <strong>${savingsRate}%</strong> this month — above the recommended 20%.`,
        });
      } else if (savingsRate >= 10) {
        insights.push({
          icon: '📊',
          type: 'info',
          text: `Your savings rate is <strong>${savingsRate}%</strong>. Aim for 20% to build wealth faster.`,
        });
      } else if (savingsRate < 10 && savingsRate >= 0) {
        insights.push({
          icon: '🚨',
          type: 'danger',
          text: `Your savings rate is only <strong>${savingsRate}%</strong>. Try the 50/30/20 rule to improve it.`,
        });
      }
    }

    // Category-level insights
    const currCat = Store.getCategoryBreakdown(userId, 'expense', 1);
    const prevCats = {};
    const prevTxns = Store.getTransactions(userId).filter(t => {
      const d = new Date(t.date);
      const now = new Date();
      return t.type === 'expense' &&
             d.getFullYear() === new Date(now.getFullYear(), now.getMonth() - 1, 1).getFullYear() &&
             d.getMonth() === new Date(now.getFullYear(), now.getMonth() - 1, 1).getMonth();
    });
    prevTxns.forEach(t => prevCats[t.category] = (prevCats[t.category] || 0) + t.amount);

    // Top overspend category
    let topCat = null, topIncrease = 0;
    Object.entries(currCat).forEach(([cat, amt]) => {
      const prev2 = prevCats[cat] || 0;
      if (prev2 > 0) {
        const inc = ((amt - prev2) / prev2) * 100;
        if (inc > 30 && inc > topIncrease) {
          topIncrease = inc;
          topCat = cat;
        }
      }
    });
    if (topCat) {
      insights.push({
        icon: '📌',
        type: 'warning',
        text: `<strong>${topCat}</strong> spending jumped by <strong>${Math.round(topIncrease)}%</strong> this month. Consider setting a budget cap.`,
      });
    }

    // Predict next month
    const pred = predictNextMonthExpense(userId);
    if (pred.predicted > 0) {
      const dir = pred.trend > 0 ? 'increase' : 'decrease';
      insights.push({
        icon: '🔮',
        type: 'info',
        text: `AI predicts next month's expenses around <strong>${currency}${pred.predicted.toLocaleString('en-IN')}</strong> — a <strong>${Math.abs(pred.trendPct)}% ${dir}</strong>.`,
      });
    }

    return insights.slice(0, 4);
  };

  /* ── Goal Recommendations ── */
  const getGoalRecommendations = (userId) => {
    const goals = Store.getGoals(userId);
    const summary = Store.getSummary(userId);
    const recs = [];
    const currency = Store.getSettings().currency || '₹';

    goals.forEach(g => {
      const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
      const remaining = g.targetAmount - g.currentAmount;
      const deadline = new Date(g.deadline);
      const monthsLeft = Math.max(1, Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24 * 30)));
      const required = Math.ceil(remaining / monthsLeft);

      if (pct < 25 && monthsLeft < 6) {
        recs.push({
          goal: g.name,
          message: `You need <strong>${currency}${required.toLocaleString('en-IN')}/month</strong> to reach <strong>${g.name}</strong> in time.`,
          urgency: 'high',
        });
      } else if (pct >= 100) {
        recs.push({
          goal: g.name,
          message: `🎉 <strong>${g.name}</strong> is complete! Consider starting a new goal.`,
          urgency: 'success',
        });
      }
    });

    if (summary.totalSavings > 0 && goals.length === 0) {
      recs.push({
        goal: 'General',
        message: `You have <strong>${currency}${summary.totalSavings.toLocaleString('en-IN')}</strong> saved. Create a savings goal to give it purpose!`,
        urgency: 'info',
      });
    }

    return recs;
  };

  return {
    predictNextMonthExpense,
    forecastSavings,
    getBudgetRecommendations,
    getSpendingInsights,
    getGoalRecommendations,
    linearRegression,
  };
})();
