export function toTwd(amount, currency, rate) {
  const n = Number(amount) || 0;
  return currency === "JPY" ? n * rate : n;
}

export function formatTwd(value) {
  return `NT$${new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: 0
  }).format(Math.round(value || 0))}`;
}

export function formatJpy(value) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(Math.round(value || 0));
}

export function normalizeExpense(expense, members) {
  return {
    id: expense.id,
    title: expense.title?.trim() || "未命名支出",
    amount: Number(expense.amount) || 0,
    currency: expense.currency || "JPY",
    payer: expense.payer || members[0],
    category: expense.category || "其他",
    splitAmong: Array.isArray(expense.splitAmong) && expense.splitAmong.length ? expense.splitAmong : members,
    note: expense.note?.trim() || "",
    createdAt: expense.createdAt || Date.now(),
    updatedAt: Date.now()
  };
}

export function calculateBalances(expenses, members, rate) {
  const balances = Object.fromEntries(members.map((member) => [member, 0]));
  let total = 0;

  expenses.forEach((expense) => {
    const amountTwd = toTwd(expense.amount, expense.currency, rate);
    const splitAmong = expense.splitAmong?.length ? expense.splitAmong : members;
    const share = splitAmong.length ? amountTwd / splitAmong.length : 0;
    total += amountTwd;

    if (balances[expense.payer] === undefined) balances[expense.payer] = 0;
    balances[expense.payer] += amountTwd;

    splitAmong.forEach((member) => {
      if (balances[member] === undefined) balances[member] = 0;
      balances[member] -= share;
    });
  });

  return {
    total,
    balances: members.map((member) => ({
      member,
      amount: Math.round(balances[member] || 0)
    }))
  };
}

export function optimizeTransfers(balanceRows) {
  const creditors = balanceRows
    .filter((row) => row.amount > 1)
    .map((row) => ({ member: row.member, amount: row.amount }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = balanceRows
    .filter((row) => row.amount < -1)
    .map((row) => ({ member: row.member, amount: -row.amount }))
    .sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > 1) {
      transfers.push({
        from: debtors[i].member,
        to: creditors[j].member,
        amount: Math.round(amount)
      });
    }
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount <= 1) i += 1;
    if (creditors[j].amount <= 1) j += 1;
  }

  return transfers;
}
