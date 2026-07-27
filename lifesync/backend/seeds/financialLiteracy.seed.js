/**
 * Financial Literacy Seed Data — "Money Basics for Students"
 * 1 course with 8 fully-written lessons, each with a quiz.
 *
 * In MOCK_DB mode: called at server startup to pre-populate the in-memory store.
 * In real MongoDB mode: run `npm run seed:learn` to populate via Mongoose.
 */

export const COURSE_DATA = {
  title: "Money Basics for Students",
  description:
    "Master the foundational money skills every student needs — from building your first budget to understanding compound interest, credit scores, and smart investing. Earn XP as you level up your financial IQ.",
  category: "finance",
  coverEmoji: "💰",
  accentColor: "#10B981",
  order: 1,
  difficulty: "beginner",
  isPublished: true,
};

export const LESSONS_DATA = [
  // ─────────────────────────────────────────────────────────────
  // LESSON 1
  // ─────────────────────────────────────────────────────────────
  {
    order: 1,
    title: "Why Money Mindset Matters",
    estimatedReadTime: 4,
    xpReward: 20,
    content: `## Why Your Money Mindset Comes First

Before we talk numbers, let's talk about *how you think* about money — because your beliefs about money shape every financial decision you make.

### 🧠 Fixed vs Growth Money Mindset

**Fixed mindset:** "I'm just bad with money. It's not my thing."
**Growth mindset:** "Money is a skill. I can learn it."

Studies show people with a growth mindset around finance accumulate **34% more savings** over their lifetime than those who believe financial ability is fixed.

### The Two Core Money Emotions

Most people feel one of two things about money:

1. **Fear** — anxiety about not having enough, debt, or making mistakes
2. **Indifference** — "money is complicated, I'll deal with it later"

Both lead to the same outcome: avoidance. And avoidance is the most expensive financial habit of all.

### 💡 The Wealth Builder's Formula

> **Awareness + Action + Consistency = Financial Freedom**

You don't need a finance degree. You need:
- **Awareness** of where your money goes
- **Action** on small, consistent decisions
- **Consistency** over months and years

### What This Course Covers

Over 8 lessons you'll learn to:
- Build a real budget that actually works
- Understand how banks and interest really work
- Build a credit score from scratch
- Invest — even on a student income
- Protect yourself from financial mistakes

**Start with the right mindset and the rest becomes easier.**`,
    quiz: [
      {
        question: "What do studies suggest about people with a growth money mindset?",
        options: [
          { label: "They earn higher salaries automatically", isCorrect: false },
          { label: "They accumulate significantly more savings over time", isCorrect: true },
          { label: "They never make financial mistakes", isCorrect: false },
          { label: "They prefer to avoid investing", isCorrect: false },
        ],
        explanation:
          "Research shows people who believe financial skills can be learned tend to build significantly more savings compared to those with a fixed mindset.",
      },
      {
        question: "According to the lesson, what is the most expensive financial habit?",
        options: [
          { label: "Spending too much on food", isCorrect: false },
          { label: "Not investing early enough", isCorrect: false },
          { label: "Avoidance — putting off financial decisions", isCorrect: true },
          { label: "Using credit cards", isCorrect: false },
        ],
        explanation:
          "Avoidance — ignoring financial topics and saying 'I'll deal with it later' — is described as the most expensive habit because problems compound over time.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // LESSON 2
  // ─────────────────────────────────────────────────────────────
  {
    order: 2,
    title: "Build Your First Budget (The 50/30/20 Rule)",
    estimatedReadTime: 6,
    xpReward: 30,
    content: `## Build Your First Budget

A budget isn't a punishment — it's a **plan for your money** that tells it where to go instead of wondering where it went.

### 📊 The 50/30/20 Rule

The simplest budgeting framework that works for almost everyone:

| Category | % of Take-Home Pay | What Goes Here |
|---|---|---|
| **Needs** | 50% | Rent, groceries, transport, phone |
| **Wants** | 30% | Dining out, subscriptions, entertainment |
| **Savings/Debt** | 20% | Emergency fund, investments, debt repayment |

### Student-Adapted Version

On a student income (part-time job + stipend), you might adjust:

- **60% Needs** — rent is expensive for students
- **20% Wants** — social life matters for wellbeing
- **20% Savings** — even ₹500/month builds the habit

### 🔧 How to Actually Build One

**Step 1: Find your monthly income**
Add up all income sources: job, allowance, grants, side gigs.

**Step 2: Track your spending for one month**
Use your bank app — categorize everything. This step alone is eye-opening.

**Step 3: Assign percentages**
Apply 50/30/20 (or your adapted version) to your income.

**Step 4: Automate what you can**
Set up auto-transfers to savings on payday. "Pay yourself first."

### 💡 Zero-Based Budgeting (Advanced)

Every rupee has a job. Income minus expenses equals **zero** — not because you spend it all, but because every rupee is assigned (including savings).

\`\`\`
Income:          ₹25,000
Rent:            -₹8,000
Groceries:       -₹4,000
Transport:       -₹2,000
Entertainment:   -₹3,000
Savings:         -₹5,000
Emergency Fund:  -₹3,000
= ₹0 (every rupee accounted for)
\`\`\`

### Common Budgeting Mistakes

❌ **Forgetting irregular expenses** — car insurance, birthday gifts, textbooks
❌ **Being too strict** — if it's unrealistic, you'll quit
❌ **Not reviewing monthly** — budgets need tweaking

**The goal isn't perfection — it's awareness.**`,
    quiz: [
      {
        question: "In the 50/30/20 rule, what does the '20' represent?",
        options: [
          { label: "Food and essentials", isCorrect: false },
          { label: "Entertainment and lifestyle", isCorrect: false },
          { label: "Savings and debt repayment", isCorrect: true },
          { label: "Housing and utilities", isCorrect: false },
        ],
        explanation:
          "The 20% in the 50/30/20 rule is allocated to savings and debt repayment — building your financial future.",
      },
      {
        question: "What is 'paying yourself first'?",
        options: [
          { label: "Spending on wants before needs", isCorrect: false },
          { label: "Automatically transferring money to savings as soon as you're paid", isCorrect: true },
          { label: "Paying off all debts before any spending", isCorrect: false },
          { label: "Giving yourself a weekly allowance", isCorrect: false },
        ],
        explanation:
          "Paying yourself first means automating savings transfers on payday, before you have a chance to spend the money.",
      },
      {
        question: "In zero-based budgeting, what does 'zero' mean?",
        options: [
          { label: "You spend every dollar you earn", isCorrect: false },
          { label: "You save everything and spend nothing", isCorrect: false },
          { label: "Every dollar is assigned a purpose so income minus expenses equals zero", isCorrect: true },
          { label: "Your bank balance reaches zero each month", isCorrect: false },
        ],
        explanation:
          "Zero-based budgeting means every dollar has a job — savings counts as an assignment. Income minus all assignments (including savings) = 0.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // LESSON 3
  // ─────────────────────────────────────────────────────────────
  {
    order: 3,
    title: "How Banks Really Work (And How They Make Money Off You)",
    estimatedReadTime: 5,
    xpReward: 25,
    content: `## How Banks Really Work

Understanding banks helps you use them to your advantage — instead of letting them profit from your confusion.

### 🏦 The Basic Bank Model

Banks are businesses. They profit by:

1. **Taking your deposits** (at low/zero interest)
2. **Lending that money** to others (at high interest)
3. **Keeping the difference** (the "spread")

> Example: Your savings earns 0.5% APY. The bank lends that money as a car loan at 7%. They pocket the 6.5% difference.

### Types of Bank Accounts

| Account Type | Purpose | Typical Interest |
|---|---|---|
| **Checking** | Daily spending, bills | 0–0.1% |
| **Savings** | Emergency fund, goals | 0.5–5% (varies) |
| **Money Market** | Higher savings with some flexibility | 4–5% (2024 rates) |
| **CD (Certificate of Deposit)** | Fixed-term savings | 4–5.5% locked in |

### 🚨 Bank Fees to Avoid

- **Monthly maintenance fees** — switch to fee-free online accounts
- **Penalty fees** — often ₹500 per transaction. Enable alerts!
- **ATM fees** — use your bank's network or get a fee-reimbursing account
- **Minimum balance fees** — understand the requirements

### High-Yield Savings & Fixed Deposits (FDs)

Traditional savings accounts pay ~2.5–3.5%. High-yield savings accounts or short-term FDs often pay **6–7.5% APY** on savings.

> On ₹50,000 saved:
> - Traditional bank: ₹1,500/year
> - High-yield / FD: **₹3,750/year**
> - On ₹5,00,000: **₹22,500/year difference**

### 💡 The Fractional Reserve Secret

Banks don't keep all your money. They're legally required to keep only a fraction in reserve and can lend out the rest. This creates new money in the economy but means your money is always "working" — which is why DICGC insurance (up to ₹5 Lakh) matters.

**Action step:** Check what your savings account is earning. If it's under 4%, consider moving it to a high-yield savings account or flexi-FD.**`,
    quiz: [
      {
        question: "How do banks primarily make money from depositors?",
        options: [
          { label: "By charging ATM fees", isCorrect: false },
          { label: "By borrowing at low rates and lending at higher rates", isCorrect: true },
          { label: "By investing in the stock market with deposits", isCorrect: false },
          { label: "By charging monthly maintenance fees", isCorrect: false },
        ],
        explanation:
          "Banks profit from the 'spread' — they pay depositors low interest rates while lending that money out at much higher rates.",
      },
      {
        question: "What is a High-Yield Savings Account (HYSA) best used for?",
        options: [
          { label: "Daily purchases and bill payments", isCorrect: false },
          { label: "Long-term stock market investing", isCorrect: false },
          { label: "Emergency fund and short-term savings goals", isCorrect: true },
          { label: "International wire transfers", isCorrect: false },
        ],
        explanation:
          "HYSAs offer significantly better interest than traditional savings accounts and are ideal for emergency funds and short-term savings.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // LESSON 4
  // ─────────────────────────────────────────────────────────────
  {
    order: 4,
    title: "The Magic (and Danger) of Compound Interest",
    estimatedReadTime: 5,
    xpReward: 30,
    content: `## Compound Interest: The 8th Wonder of the World

Albert Einstein allegedly called compound interest the "8th wonder of the world." Whether or not he said it, the math is genuinely remarkable.

### 📈 Simple vs Compound Interest

**Simple interest:** Interest only on the original principal.
> ₹50,000 × 5% × 10 years = ₹25,000 earned

**Compound interest:** Interest on principal *and* accumulated interest.
> ₹50,000 at 5% compounded annually for 10 years = **₹31,445 earned** (+₹6,445 extra — for doing nothing)

The longer you wait, the bigger the difference.

### The Rule of 72

A quick mental math shortcut:

> **72 ÷ interest rate = years to double your money**

- At 6%: 72 ÷ 6 = **12 years** to double
- At 9%: 72 ÷ 9 = **8 years** to double
- At 12%: 72 ÷ 12 = **6 years** to double

### ⏳ The Power of Starting Early

Two students, same ₹50,000 invested at 8% annual return:

| | Anna | Ben |
|---|---|---|
| Starts investing at | 22 | 32 |
| Stops contributing | 32 (10 years) | 62 (30 years) |
| Total invested | $5,000 | $15,000 |
| Value at 62 | **$159,602** | **$50,313** |

Anna invested **less** but started earlier. Time is the most powerful variable.

### 🚨 Compound Interest Working Against You

Compound interest is a superpower for savings — and a weapon for debt.

Credit card at 24% APR:
- $2,000 balance, paying minimum ($50/month)
- Time to pay off: **62 months**
- Total paid: **$3,042** (paid $1,042 in interest alone)

The same math that grows your savings can balloon debt if you only pay minimums.

### Compounding Frequency Matters

The more often interest compounds, the faster it grows:

| Frequency | $10,000 at 5% after 10 years |
|---|---|
| Annual | $16,289 |
| Monthly | $16,470 |
| Daily | $16,487 |

**Key insight:** Start investing even small amounts *today*. The calendar is your biggest asset.`,
    quiz: [
      {
        question: "Using the Rule of 72, how long does it take money to double at a 9% annual return?",
        options: [
          { label: "9 years", isCorrect: false },
          { label: "8 years", isCorrect: true },
          { label: "12 years", isCorrect: false },
          { label: "6 years", isCorrect: false },
        ],
        explanation: "Rule of 72: 72 ÷ 9 = 8 years. It's a quick mental math shortcut for estimating doubling time.",
      },
      {
        question: "In the Anna vs Ben example, why did Anna end up with more money despite investing less?",
        options: [
          { label: "She invested in better stocks", isCorrect: false },
          { label: "She had a higher interest rate", isCorrect: false },
          { label: "She started investing 10 years earlier, giving compound interest more time to work", isCorrect: true },
          { label: "She made fewer withdrawals", isCorrect: false },
        ],
        explanation:
          "Time is the most powerful variable in compound interest. Anna's earlier start gave her decades more for her money to compound.",
      },
      {
        question: "Compound interest on credit card debt is dangerous because:",
        options: [
          { label: "It increases your credit limit automatically", isCorrect: false },
          { label: "It causes your balance to grow even when you make payments", isCorrect: true },
          { label: "It lowers your credit score", isCorrect: false },
          { label: "Banks can withdraw it from savings", isCorrect: false },
        ],
        explanation:
          "When you only pay minimums, interest compounds on the remaining balance — meaning you can end up paying significantly more than you originally borrowed.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // LESSON 5
  // ─────────────────────────────────────────────────────────────
  {
    order: 5,
    title: "Credit Scores: What They Are and How to Build One",
    estimatedReadTime: 6,
    xpReward: 35,
    content: `## Credit Scores Demystified

Your credit score is a 3-digit number (300–850) that tells lenders how likely you are to repay borrowed money. It follows you for life and affects far more than just loans.

### 🏠 What Your Credit Score Affects

- **Home loan rates** — a 100-point difference can cost ₹5,00,000+ over a 20-year loan
- **Car loan interest** — excellent vs poor credit: 7.5% vs 14% APR on a ₹5,00,000 loan
- **Apartment applications** — many landlords/societies check background
- **Job applications** — finance/bank employers check credit history

### The 5 Factors (Credit / CIBIL Score Breakdown)

| Factor | Weight | What Matters |
|---|---|---|
| **Payment History** | 35% | Never miss an EMI or credit card bill |
| **Credit Utilization** | 30% | Use <30% of your total credit limit |
| **Length of History** | 15% | Older accounts = better credit age |
| **Credit Mix** | 10% | Secured + unsecured loans |
| **New Inquiries** | 10% | Don't apply for multiple cards at once |

### 📈 Building Credit from Zero (Student Edition)

**Step 1: Get a secured credit card against FD**
Put down ₹5,000–₹10,000 fixed deposit. Use it for small purchases. Pay in full monthly.

**Step 2: Become an authorized user / add add-on card**
Ask a parent/guardian to add an add-on card.

**Step 3: Get a student/entry-level credit card**
Designed for low/no credit history with low limits to keep risk manageable.

**Step 4: Pay every bill on time, every time**
Set up autopay for full balance or minimum bill.

**Step 5: Keep utilization low**
If your limit is ₹50,000, keep the balance under ₹15,000 (30%). Ideal is under 10%.

### Score Ranges

| Score | Rating | What It Means |
|---|---|---|
| 800–850 | Exceptional | Best rates, easy approvals |
| 740–799 | Very Good | Great rates |
| 670–739 | Good | Most loans approved |
| 580–669 | Fair | Higher rates, some denials |
| <580 | Poor | Difficult to get credit |

### 🚨 Credit Myths Busted

❌ **Myth:** Checking your own score hurts it.
✅ **Truth:** Soft inquiries (checking your own) don't affect your score.

❌ **Myth:** You need to carry a balance to build credit.
✅ **Truth:** Pay in full monthly. Carrying a balance costs you interest and doesn't help your score.

❌ **Myth:** Closing old cards improves your score.
✅ **Truth:** Closing cards reduces your available credit and can hurt utilization ratio.`,
    quiz: [
      {
        question: "Which factor has the biggest impact on your FICO credit score?",
        options: [
          { label: "Credit utilization (30%)", isCorrect: false },
          { label: "Payment history (35%)", isCorrect: true },
          { label: "Length of credit history (15%)", isCorrect: false },
          { label: "Credit mix (10%)", isCorrect: false },
        ],
        explanation:
          "Payment history at 35% is the single biggest factor. Never missing a payment is the most important thing you can do for your credit score.",
      },
      {
        question: "What is the recommended credit utilization ratio to maintain a good score?",
        options: [
          { label: "Under 10% is ideal, below 30% is generally acceptable", isCorrect: true },
          { label: "Exactly 50% to show active credit use", isCorrect: false },
          { label: "100% — use your full credit limit every month", isCorrect: false },
          { label: "Zero — never use your credit card", isCorrect: false },
        ],
        explanation:
          "Experts recommend keeping credit utilization under 30% of your total limit, with under 10% being ideal for maximum score benefit.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // LESSON 6
  // ─────────────────────────────────────────────────────────────
  {
    order: 6,
    title: "Emergency Funds: Your Financial Safety Net",
    estimatedReadTime: 4,
    xpReward: 25,
    content: `## Emergency Funds: The Most Important Account You'll Ever Open

Before you invest a single dollar, you need an emergency fund. This is non-negotiable.

### 🛡️ What Is an Emergency Fund?

A dedicated savings account containing 3–6 months of living expenses, kept liquid (easily accessible), used **only** for genuine emergencies:

✅ Job loss
✅ Medical emergency
✅ Car breakdown needed to get to work
✅ Essential appliance failure

❌ Not for: Sales, vacations, impulse purchases

### How Much Do You Need?

**Student starting point:** ₹5,000–₹10,000
**3-month target:** Monthly expenses × 3
**6-month target (ideal):** Monthly expenses × 6

> Example: If your monthly expenses are ₹15,000
> - Starter goal: ₹10,000
> - 3-month target: ₹45,000
> - 6-month target: ₹90,000

### Why Not Just Use a Credit Card?

Using credit in emergencies:
- Adds high-interest debt on top of an already stressful situation
- Average credit card APR: 24–42%
- A ₹20,000 medical bill on credit costs ~₹4,800 extra per year in interest

An emergency fund lets you handle crises **without creating new debt.**

### 🏦 Where to Keep It

**Requirements:**
1. Liquid (accessible within 1-2 days)
2. Separate from checking (so you don't accidentally spend it)
3. Earning something (high-yield savings / flexi-FD at 6-7.5% beats traditional savings)

**Not appropriate:** Stock market (could be down when you need it), physical cash at home.

### The Psychological Benefit

Studies show people with 3+ months of emergency savings report:
- 47% lower financial anxiety
- Better sleep quality
- Willingness to take positive career risks (new job, starting a business)

### 🚀 How to Build It Quickly

1. **Automate ₹500–₹1,000/week** to a separate savings account/FD
2. **Redirect windfalls** — festival gifts, birthday money, bonuses
3. **Sell unused items** — one weekend of decluttering can add ₹2,000–₹5,000
4. **Cut one subscription** — use that ₹299/month for the fund

**The emergency fund is your first financial superpower. Build it before anything else.**`,
    quiz: [
      {
        question: "What is the recommended starting emergency fund goal for most students?",
        options: [
          { label: "₹500–₹1,000", isCorrect: false },
          { label: "₹5,000–₹10,000", isCorrect: true },
          { label: "₹50,000–₹1,000,000", isCorrect: false },
          { label: "One year of expenses", isCorrect: false },
        ],
        explanation:
          "Starting with ₹5,000–₹10,000 gives meaningful protection from common emergencies without requiring a huge upfront commitment.",
      },
      {
        question: "Why is it recommended NOT to invest your emergency fund in stocks?",
        options: [
          { label: "Stocks are too complicated for beginners", isCorrect: false },
          { label: "Stock gains are taxable", isCorrect: false },
          { label: "The market could be down exactly when you need the money", isCorrect: true },
          { label: "Stocks don't pay interest", isCorrect: false },
        ],
        explanation:
          "Emergency funds must be liquid and stable. Markets can drop 30–40% during recessions — precisely when you're most likely to need emergency funds (job loss).",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // LESSON 7
  // ─────────────────────────────────────────────────────────────
  {
    order: 7,
    title: "Investing 101: Start with ₹100 (No, Really)",
    estimatedReadTime: 7,
    xpReward: 40,
    content: `## Investing 101: You Don't Need Thousands to Start

The biggest investing myth: "I'll start investing when I have more money." The truth? Starting with ₹100 today beats waiting to invest ₹10,000 in 5 years.

### 📈 What Is Investing?

Putting money to work so it generates returns over time — instead of sitting in cash and losing value to inflation.

> Inflation averages ~5–6% per year in India. If your savings account earns 2.5%, you're effectively **losing 3% purchasing power annually.**

### Investment Types (From Safest to Riskiest)

| Type | Risk | Typical Return | Best For |
|---|---|---|---|
| **Savings Account / FD** | Very Low | 3–7% | Emergency fund |
| **PPF / Sovereign Gold Bonds** | Very Low | 7–8% | Tax-free long term |
| **Index Funds / Mutual Funds** | Medium | 10–12% avg | Long-term wealth |
| **Direct Equity (Stocks)** | Higher | Varies widely | Research + conviction |
| **Crypto** | Very High | Highly volatile | Speculative only |

### 🏆 Index Funds: The Beginner's Best Friend

An index fund tracks a market index (like Nifty 50 or Sensex — top companies in India). Instead of picking individual stocks, you own a tiny slice of top 50 companies.

**Why index funds win:**
- **Diversification:** 1 fund = 50 top companies. One company failing doesn't ruin you.
- **Low fees:** Expense ratio can be as low as 0.05–0.2% annually.
- **No expertise required:** Set up a monthly SIP, invest regularly, don't touch it.

### Getting Started with ₹100

**Platforms that let you start small via SIP:**
- **Zerodha / Coin** — Direct mutual funds, $0 brokerage for investing
- **Groww** — ₹100 SIP minimum, user friendly for beginners
- **Indmoney** — Index funds & US stock fractional investing
- **Paytm Money** — Low entry minimums

### 💡 Systematic Investment Plan (SIP) / Rupee-Cost Averaging

Invest a fixed amount every month on a set date, regardless of market conditions.

> Invest ₹500 every month no matter what the market does.

**Benefits:**
- Removes emotion from investing
- Automatically buys more units when market is down (rupee cost averaging)
- Builds disciplined habit of regular investing

### The Student Investment Stack

**Order of priority:**
1. Emergency fund (1–3 months) ← Do this first
2. EPF / Corporate match (if working) ← Always take it
3. PPF / ELSS Mutual Funds (tax-saving + long-term growth)
4. Nifty 50 Index Fund SIP

### What NOT to Do

❌ **Trying to time the market** — even experts fail at this
❌ **Panic selling during downturns** — market dips are buying opportunities
❌ **Investing money you'll need in under 3 years** — market can be volatile short-term
❌ **Chasing "hot" tips / F&O trading** — high risk, not investing

**The boring, consistent SIP strategy is the winning strategy.**`,
    quiz: [
      {
        question: "What is the main advantage of a Nifty 50 index fund over picking individual stocks?",
        options: [
          { label: "Higher guaranteed returns", isCorrect: false },
          { label: "Instant diversification across top 50 companies with low fees", isCorrect: true },
          { label: "No risk of losing money", isCorrect: false },
          { label: "It only invests in tech companies", isCorrect: false },
        ],
        explanation:
          "Index funds provide instant diversification — owning a tiny slice of top companies. This reduces risk significantly compared to picking individual stocks.",
      },
      {
        question: "What is Systematic Investment Plan (SIP) / Rupee-Cost Averaging?",
        options: [
          { label: "Buying stocks when they're at their lowest price", isCorrect: false },
          { label: "Investing a fixed amount at regular intervals regardless of market conditions", isCorrect: true },
          { label: "Averaging the cost of multiple stock purchases to find the best deal", isCorrect: false },
          { label: "Converting rupees to other currencies for investment", isCorrect: false },
        ],
        explanation:
          "SIP / Rupee-Cost Averaging means investing a consistent amount (e.g., ₹500/month) on a regular schedule, regardless of whether the market is up or down.",
      },
      {
        question: "In the student investment stack, what should come BEFORE investing in the stock market?",
        options: [
          { label: "Opening a cryptocurrency account", isCorrect: false },
          { label: "Buying individual stocks in companies you like", isCorrect: false },
          { label: "Building an emergency fund and capturing any EPF/corporate match", isCorrect: true },
          { label: "Paying off your student loan completely", isCorrect: false },
        ],
        explanation:
          "Financial priority order: emergency fund first, then any employer match, then investment accounts. This ensures stability before growth.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // LESSON 8
  // ─────────────────────────────────────────────────────────────
  {
    order: 8,
    title: "Avoiding Financial Traps: Debt, Scams & Lifestyle Inflation",
    estimatedReadTime: 6,
    xpReward: 35,
    content: `## Protecting Your Financial Future

Knowing what to do with money is half the battle. Knowing what NOT to do can save you years of setbacks.

### 🚨 Trap 1: Lifestyle Inflation

You get a raise. You immediately upgrade your apartment, car, and wardrobe. This is lifestyle inflation — and it's why most people never build wealth despite earning decent incomes.

**The antidote:** When income increases, increase savings rate proportionally.

> Get a ₹5,000/month raise? Increase savings by ₹2,500. Enjoy ₹2,500 extra. This is balance.

**Stealth lifestyle inflation warning signs:**
- Monthly subscriptions creeping up (audit them!)
- "Treating yourself" becoming the default, not the exception
- Upgrading before the old thing breaks

### 🚨 Trap 2: Bad Debt vs Good Debt

**Good debt:** Borrows to create value
- Education loans (if chosen wisely) — invests in earning potential
- Home loan — builds equity, often beats renting
- Business loan — funds revenue-generating activity

**Bad debt:** Borrowing for depreciating assets or consumption
- Credit card balances carried monthly
- Car/bike loans for luxury vehicles
- Buy-Now-Pay-Later (BNPL) for impulse purchases

**Rule:** If the debt earns you more than it costs, it might be good debt. If it doesn't, it's bad debt.

### 🚨 Trap 3: Financial Scams (Student Edition)

**Common scams targeting students:**

**Fake internship/scholarship offers** — "You've won a scholarship! Just pay ₹500 in registration fees." Real scholarships never charge fees.

**Pyramid schemes / MLMs** — "Earn ₹50,000/month working from home selling our products." The majority of participants lose money.

**Crypto / Telegram pump-and-dump** — Channel promotes a coin, you buy in, price crashes, admins already sold.

**High-interest instant loan apps** — Predatory apps charging astronomical interest & penalty fees.

**Warning signs:**
- Promises of guaranteed high returns
- Urgency ("Act now or miss out!")
- Requires you to recruit others
- Requests for upfront payments

### 🚨 Trap 4: FOMO Investing

Social media makes everyone look like a genius investor. You hear about a stock/crypto that "10x'd" and feel like you missed out.

Reality:
- You only hear about wins, not the losses
- By the time it's on social media, the run-up is likely over
- FOMO-driven investing is one of the most reliable ways to buy high and sell low

### 💡 The Financial Protection Mindset

> **Offense:** Growing income and investments
> **Defense:** Protecting what you've built

Both matter equally. Avoiding traps IS a form of wealth building.

### Your Financial Literacy Checklist ✅

By completing this course, you now know how to:
- [ ] Think about money with a growth mindset
- [ ] Build and maintain a realistic budget
- [ ] Choose the right bank accounts
- [ ] Understand compound interest (and use it)
- [ ] Build a credit score from scratch
- [ ] Create an emergency fund
- [ ] Start investing with any amount
- [ ] Avoid common financial traps

**Congratulations — you've completed Money Basics for Students! 🎓💰**`,
    quiz: [
      {
        question: "What is lifestyle inflation?",
        options: [
          { label: "The rising cost of living due to inflation", isCorrect: false },
          { label: "Increasing spending proportionally whenever income increases", isCorrect: true },
          { label: "Investing more when the economy is doing well", isCorrect: false },
          { label: "A budgeting strategy for high earners", isCorrect: false },
        ],
        explanation:
          "Lifestyle inflation means spending more as you earn more, often without conscious choice. It prevents wealth building even at high income levels.",
      },
      {
        question: "Which of the following is an example of 'good debt'?",
        options: [
          { label: "Credit card balance carried month-to-month at 24% APR", isCorrect: false },
          { label: "A payday loan for concert tickets", isCorrect: false },
          { label: "A student loan that meaningfully increases your earning potential", isCorrect: true },
          { label: "Buy-now-pay-later for a new phone you don't need", isCorrect: false },
        ],
        explanation:
          "Good debt creates value — student loans, mortgages, and business loans can increase your earning potential or build equity. Bad debt funds consumption of depreciating assets.",
      },
      {
        question: "What is a reliable warning sign of a financial scam?",
        options: [
          { label: "The investment requires a long-term commitment", isCorrect: false },
          { label: "The return is similar to stock market averages", isCorrect: false },
          { label: "Promises of guaranteed high returns with little or no risk", isCorrect: true },
          { label: "The company is registered and publicly traded", isCorrect: false },
        ],
        explanation:
          "No legitimate investment can guarantee high returns. 'Guaranteed high returns with no risk' is the clearest red flag of investment fraud.",
      },
    ],
  },
];

/**
 * seedFinancialLiteracy — populates Course + Lessons into the active DB.
 * Works with both real Mongoose and the mock in-memory store.
 *
 * @param {Object} CourseModel - Mongoose model or MockModelBase
 * @param {Object} LessonModel - Mongoose model or MockModelBase
 */
export async function seedFinancialLiteracy(CourseModel, LessonModel) {
  try {
    // Idempotent: skip if already seeded
    const existing = await CourseModel.findOne({ title: COURSE_DATA.title });
    if (existing) {
      console.log("ℹ️  Financial literacy course already seeded — skipping.");
      return;
    }

    const course = await CourseModel.create({
      ...COURSE_DATA,
      totalLessons: LESSONS_DATA.length,
      totalXp: LESSONS_DATA.reduce((sum, l) => sum + l.xpReward, 0),
    });

    const courseId = course._id;

    for (const lessonData of LESSONS_DATA) {
      await LessonModel.create({
        ...lessonData,
        course: courseId,
      });
    }

    console.log(
      `✅ Seeded: "${COURSE_DATA.title}" with ${LESSONS_DATA.length} lessons.`
    );
  } catch (err) {
    console.error("❌ Seed error:", err.message);
  }
}
