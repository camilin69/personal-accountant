// store/useStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoreState, Category, Transaction, Goal, Debt, Habit, Post, User, GoalTransaction, SimulationTransaction, Wallet, DebtPayment } from '../types';

const generateId = () => Date.now().toString();

// Default categories
const defaultCategories: Category[] = [
  { id: '1', userId: '1', name: 'Salary', type: 'income', icon: '💰', color: '#10B981', isDefault: true, createdAt: new Date().toISOString() },
  { id: '2', userId: '1', name: 'Freelance', type: 'income', icon: '💻', color: '#10B981', isDefault: true, createdAt: new Date().toISOString() },
  { id: '3', userId: '1', name: 'Gift', type: 'income', icon: '🎁', color: '#10B981', isDefault: true, createdAt: new Date().toISOString() },
  { id: '4', userId: '1', name: 'Food', type: 'expense', icon: '🍔', color: '#EF4444', isDefault: true, createdAt: new Date().toISOString() },
  { id: '5', userId: '1', name: 'Transport', type: 'expense', icon: '🚗', color: '#F59E0B', isDefault: true, createdAt: new Date().toISOString() },
  { id: '6', userId: '1', name: 'Weed', type: 'expense', icon: '🌿', color: '#14B8A6', isDefault: true, createdAt: new Date().toISOString() },
  { id: '7', userId: '1', name: 'Entertainment', type: 'expense', icon: '🎮', color: '#A855F7', isDefault: true, createdAt: new Date().toISOString() },
  { id: '8', userId: '1', name: 'Savings', type: 'expense', icon: '💰', color: '#10B981', isDefault: true, createdAt: new Date().toISOString() },
  { id: '9', userId: '1', name: 'Health', type: 'expense', icon: '💪', color: '#EC4899', isDefault: true, createdAt: new Date().toISOString() },
  { id: '10', userId: '1', name: 'Education', type: 'expense', icon: '📚', color: '#6366F1', isDefault: true, createdAt: new Date().toISOString() },
  { id: '11', userId: '1', name: 'Rent', type: 'expense', icon: '🏠', color: '#FF6584', isDefault: true, createdAt: new Date().toISOString() },
  { id: '12', userId: '1', name: 'Utilities', type: 'expense', icon: '⚡', color: '#F59E0B', isDefault: true, createdAt: new Date().toISOString() },
];

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: { id: '1', username: 'yung_nigga', email: 'yung@example.com', plan: 'free', createdAt: '2026-01-01' },
      categories: defaultCategories,
      transactions: [] as Transaction[],
      goals: [],
      debts: [],
      wallets: [] as Wallet[],
      habits: [],
      posts: [],
      simulationTransactions: [] as SimulationTransaction[],
      isLoading: false,
      filters: {
        categoryId: null,
        type: 'all',
        startDate: null,
        endDate: null,
      },
      
      // Setters
      setUser: (user) => set({ user }),
      setCategories: (categories) => set({ categories }),
      setTransactions: (transactions) => set({ transactions }),
      setGoals: (goals) => set({ goals }),
      setDebts: (debts) => set({ debts }),
      setHabits: (habits) => set({ habits }),
      setPosts: (posts) => set({ posts }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
      setSimulationTransactions: (transactions: SimulationTransaction[]) => set({ simulationTransactions: transactions }),
      setWallets: (wallets) => set({ wallets }),

      // Category actions
      addCategory: (category) => {
        const newCategory: Category = {
          ...category,
          id: generateId(),
          userId: get().user?.id || '1',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ categories: [...state.categories, newCategory] }));
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },

      deleteCategory: (id) => {
        const transactions = get().transactions;
        const isInUse = transactions.some(t => t.categoryId === id);
        if (isInUse) {
          alert('Cannot delete category that has transactions. Please reassign or delete transactions first.');
          return;
        }
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }));
      },

      // Transaction actions
      addTransaction: (transaction) => {
        const category = get().categories.find(c => c.id === transaction.categoryId);
        const newTransaction: Transaction = {
          ...transaction,
          id: generateId(),
          userId: get().user?.id || '1',
          categoryName: category?.name || 'Other',
        };
        set((state) => ({ transactions: [newTransaction, ...state.transactions] }));
        
        // Actualizar balance de wallet
        const wallet = get().wallets.find(w => w.id === transaction.walletId);
        if (wallet && category) {
          const isIncome = category.type === 'income';
          get().updateWalletBalance(transaction.walletId, transaction.amount, isIncome);
        }
      },

      updateTransaction: (id, updates) => {
        // Obtener la transacción original antes de actualizar
        const oldTransaction = get().transactions.find(t => t.id === id);
        const oldCategory = oldTransaction ? get().categories.find(c => c.id === oldTransaction.categoryId) : null;
        
        set((state) => {
          let updatedTransactions = state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          );
          if (updates.categoryId) {
            const category = state.categories.find(c => c.id === updates.categoryId);
            updatedTransactions = updatedTransactions.map((t) =>
              t.id === id ? { ...t, categoryName: category?.name || 'Other' } : t
            );
          }
          return { transactions: updatedTransactions };
        });
        
        // Actualizar balances de wallet si cambió el monto, categoría o wallet
        const newTransaction = get().transactions.find(t => t.id === id);
        if (newTransaction && oldTransaction) {
          const newCategory = get().categories.find(c => c.id === newTransaction.categoryId);
          const oldCategoryType = oldCategory?.type;
          const newCategoryType = newCategory?.type;
          
          // Revertir balance anterior
          if (oldCategoryType === 'income') {
            get().updateWalletBalance(oldTransaction.walletId, oldTransaction.amount, false);
          } else if (oldCategoryType === 'expense') {
            get().updateWalletBalance(oldTransaction.walletId, oldTransaction.amount, true);
          }
          
          // Aplicar nuevo balance
          if (newCategoryType === 'income') {
            get().updateWalletBalance(newTransaction.walletId, newTransaction.amount, true);
          } else if (newCategoryType === 'expense') {
            get().updateWalletBalance(newTransaction.walletId, newTransaction.amount, false);
          }
        }
      },

      deleteTransaction: (id: string) => {
        const transaction = get().transactions.find(t => t.id === id);
        const category = transaction ? get().categories.find(c => c.id === transaction.categoryId) : null;
        
        // Verificar si es un pago de deuda
        if (transaction?.tags.includes('debt-payment')) {
          // Buscar el debtId en los tags
          const debtId = transaction.tags.find(tag => tag !== 'debt-payment' && tag !== id);
          if (debtId) {
            // Eliminar el payment de la deuda
            const debt = get().debts.find(d => d.id === debtId);
            if (debt && debt.payments) {
              const paymentToRemove = debt.payments.find(p => 
                p.amount === transaction.amount && 
                p.date === transaction.date
              );
              if (paymentToRemove) {
                const updatedPayments = debt.payments.filter(p => p.id !== paymentToRemove.id);
                const newRemainingBalance = debt.remainingBalance + paymentToRemove.amount;
                set((state) => ({
                  debts: state.debts.map(d =>
                    d.id === debtId
                      ? { ...d, payments: updatedPayments, remainingBalance: newRemainingBalance }
                      : d
                  )
                }));
              }
            }
          }
        }
        
        // Revertir el balance de la wallet
        if (transaction && category) {
          if (category.type === 'income') {
            get().updateWalletBalance(transaction.walletId, transaction.amount, false);
          } else if (category.type === 'expense') {
            get().updateWalletBalance(transaction.walletId, transaction.amount, true);
          }
        }
        
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },

      // Wallet actions
      addWallet: (wallet) => {
        const newWallet: Wallet = {
          ...wallet,
          id: generateId(),
          userId: get().user?.id || '1',
          currentBalance: wallet.initialBalance,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ wallets: [...state.wallets, newWallet] }));
      },

      updateWallet: (id, updates) => {
        set((state) => ({
          wallets: state.wallets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        }));
      },

      deleteWallet: (id) => {
        const transactions = get().transactions;
        const hasTransactions = transactions.some(t => t.walletId === id);
        if (hasTransactions) {
          alert('Cannot delete wallet with associated transactions. Please reassign or delete transactions first.');
          return;
        }
        set((state) => ({
          wallets: state.wallets.filter((w) => w.id !== id),
        }));
      },

      updateWalletBalance: (walletId, amount, isIncome) => {
        set((state) => ({
          wallets: state.wallets.map((w) =>
            w.id === walletId
              ? { ...w, currentBalance: w.currentBalance + (isIncome ? amount : -amount) }
              : w
          ),
        }));
      },

      // Simulation Transaction actions
      addSimulationTransaction: (transaction: Omit<SimulationTransaction, 'id' | 'userId' | 'createdAt'>) => {
        const newTransaction: SimulationTransaction = {
          ...transaction,
          period: transaction.period || 'day',
          id: generateId(),
          userId: get().user?.id || '1',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ simulationTransactions: [...state.simulationTransactions, newTransaction] }));
      },

      updateSimulationTransaction: (id: string, updates: Partial<SimulationTransaction>) => {
        set((state) => ({
          simulationTransactions: state.simulationTransactions.map(t => t.id === id ? { ...t, ...updates } : t),
        }));
      },

      deleteSimulationTransaction: (id: string) => {
        set((state) => ({
          simulationTransactions: state.simulationTransactions.filter(t => t.id !== id),
        }));
      },

      // Goal actions
      addGoal: (goal) => {
        const newGoal: Goal = { 
          ...goal, 
          id: generateId(), 
          currentAmount: 0, 
          status: 'active',
          userId: get().user?.id || '1',
          transactions: [],
          purchaseCategoryId: goal.purchaseCategoryId || '',
        };
        set((state) => ({ goals: [...state.goals, newGoal] }));
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id === id) {
              const updated = { ...g, ...updates };
              if (updates.status === 'completed' && !updated.completedAt) {
                updated.completedAt = new Date().toISOString();
              }
              return updated;
            }
            return g;
          }),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));
      },

      addGoalTransaction: (goalId: string, transaction: Omit<GoalTransaction, 'id'>) => {
        const newTransaction: GoalTransaction = { ...transaction, id: generateId(), goalId };
        set((state) => ({
          goals: state.goals.map(g => 
            g.id === goalId 
              ? { ...g, transactions: [...(g.transactions || []), newTransaction] }
              : g
          )
        }));
      },

      updateGoalAmount: (goalId: string, amount: number) => {
        set((state) => ({
          goals: state.goals.map(g => {
            if (g.id === goalId) {
              const newAmount = Math.min(amount, g.targetAmount);
              const newStatus = newAmount >= g.targetAmount ? 'completed' : g.status;
              return { ...g, currentAmount: newAmount, status: newStatus };
            }
            return g;
          })
        }));
      },

      // Debt actions
      addDebt: (debt: Omit<Debt, 'id' | 'userId' | 'createdAt' | 'remainingBalance' | 'payments'>) => {
        const category = get().categories.find(c => c.id === debt.categoryId);
        const isIncome = debt.type === 'borrowed'; // Me prestaron → ingreso
        
        // Crear la deuda
        const newDebt: Debt = {
          ...debt,
          id: generateId(),
          userId: get().user?.id || '1',
          remainingBalance: debt.originalAmount,
          payments: [],
          createdAt: new Date().toISOString(),
        };
        
        // Crear transacción automática (SOLO UNA VEZ)
        const transactionId = generateId();
        const newTransaction: Transaction = {
          id: transactionId,
          userId: get().user?.id || '1',
          amount: debt.originalAmount,
          categoryId: debt.categoryId,
          categoryName: category?.name || 'Other',
          walletId: debt.walletId,
          description: `${debt.type === 'borrowed' ? 'Loan received from' : 'Loan given to'} ${debt.creditorName}`,
          date: debt.startDate, // Usar la fecha exacta del formulario
          tags: ['debt', debt.type, newDebt.id],
        };
        
        // Actualizar wallet balance
        get().updateWalletBalance(debt.walletId, debt.originalAmount, isIncome);
        
        set((state) => ({ 
          debts: [...state.debts, newDebt],
          transactions: [newTransaction, ...state.transactions]
        }));
      },


      updateDebt: (id, updates) => {
        set((state) => ({
          debts: state.debts.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        }));
      },

      deleteDebt: (id: string) => {
        const debt = get().debts.find(d => d.id === id);
        if (debt) {
          // Eliminar transacciones asociadas a esta deuda
          const transactionsToDelete = get().transactions.filter(t => 
            t.tags.includes(id) || 
            (t.description.includes(debt.creditorName) && t.tags.includes('debt'))
          );
          
          transactionsToDelete.forEach(t => {
            // Revertir el balance de la wallet
            const category = get().categories.find(c => c.id === t.categoryId);
            if (category) {
              const wasIncome = category.type === 'income';
              get().updateWalletBalance(t.walletId, t.amount, !wasIncome);
            }
          });
          
          set((state) => ({
            debts: state.debts.filter((d) => d.id !== id),
            transactions: state.transactions.filter((t) => !t.tags.includes(id))
          }));
        } else {
          set((state) => ({
            debts: state.debts.filter((d) => d.id !== id),
          }));
        }
      },

      addDebtPayment: (debtId: string, payment: Omit<DebtPayment, 'id' | 'debtId'>) => {
        const debt = get().debts.find(d => d.id === debtId);
        if (!debt) return;
        
        const newPayment: DebtPayment = { ...payment, id: generateId(), debtId };
        const newBalance = debt.remainingBalance - payment.amount;
        const isFullyPaid = newBalance <= 0;
        
        // Obtener o crear categoría "Debt Payment"
        let paymentCategoryId = get().categories.find(c => c.name === 'Debt Payment' && c.type === 'expense')?.id;
        if (!paymentCategoryId) {
          const newCategory: Category = {
            id: 'debt-payment-default',
            userId: get().user?.id || '1',
            name: 'Debt Payment',
            type: 'expense',
            icon: '💸',
            color: '#EF4444',
            isDefault: true,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({ categories: [...state.categories, newCategory] }));
          paymentCategoryId = newCategory.id;
        }
        
        // Crear transacción para el pago con referencia a la deuda
        const transactionId = generateId();
        const newTransaction: Transaction = {
          id: transactionId,
          userId: get().user?.id || '1',
          amount: payment.amount,
          categoryId: paymentCategoryId,
          categoryName: 'Debt Payment',
          walletId: debt.walletId,
          description: `Payment to ${debt.creditorName}${payment.notes ? ` - ${payment.notes}` : ''}`,
          date: payment.date,
          tags: ['debt-payment', debtId, transactionId],
        };
        
        // Actualizar wallet balance (siempre resta, porque estás pagando)
        get().updateWalletBalance(debt.walletId, payment.amount, false);
        
        set((state) => ({
          debts: state.debts.map((d) => 
            d.id === debtId 
              ? { 
                  ...d, 
                  payments: [...(d.payments || []), newPayment],
                  remainingBalance: newBalance,
                  status: isFullyPaid ? 'paid' : d.status
                }
              : d
          ),
          transactions: [newTransaction, ...state.transactions]
        }));
      },




      // Habit actions
      addHabit: (habit) => {
        const newHabit = { 
          ...habit, 
          id: generateId(), 
          currentStreak: 0, 
          bestStreak: 0,
          userId: get().user?.id || '1'
        };
        set((state) => ({ habits: [...state.habits, newHabit] }));
      },

      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id === id) {
              const updated = { ...h, ...updates };
              if (updates.currentStreak && updates.currentStreak > (h.bestStreak || 0)) {
                updated.bestStreak = updates.currentStreak;
              }
              return updated;
            }
            return h;
          }),
        }));
      },

      deleteHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
        }));
      },

      checkHabit: (id, date) => {
        const habit = get().habits.find(h => h.id === id);
        if (habit) {
          get().updateHabit(id, { currentStreak: habit.currentStreak + 1 });
        }
      },

      addPost: (post) => {
        const newPost = {
          ...post,
          id: generateId(),
          likesCount: 0,
          commentsCount: 0,
          createdAt: new Date().toISOString().split('T')[0],
          userId: get().user?.id || '1',
        };
        set((state) => ({ posts: [newPost, ...state.posts] }));
      },

      likePost: (id) => {
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id ? { ...p, likesCount: p.likesCount + 1 } : p
          ),
        }));
      },

      deletePost: (id) => {
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== id),
        }));
      },
    }),
    {
      name: 'yung-accountant-storage',
    }
  )
);

// Selectors
export const useTotalBalance = () => {
  const transactions = useStore((state) => state.transactions);
  const categories = useStore((state) => state.categories);
  
  return transactions.reduce((total, t) => {
    const category = categories.find(c => c.id === t.categoryId);
    if (category?.type === 'income') {
      return total + t.amount;
    } else {
      return total - t.amount;
    }
  }, 0);
};

export const useGoalsAllocatedBalance = () => {
  const goals = useStore((state) => state.goals);
  return goals
    .filter(goal => goal.status === 'active')
    .reduce((total, goal) => total + goal.currentAmount, 0);
};

export const useAvailableBalance = () => {
  const totalBalance = useTotalBalance();
  const allocatedToGoals = useGoalsAllocatedBalance();
  return totalBalance - allocatedToGoals;
};

export const useDebtsBalance = () => {
  const debts = useStore((state) => state.debts);
  const borrowed = debts
    .filter(d => d.type === 'borrowed' && d.status === 'active')
    .reduce((sum, d) => sum + d.remainingBalance, 0);
  const lent = debts
    .filter(d => d.type === 'lent' && d.status === 'active')
    .reduce((sum, d) => sum + d.remainingBalance, 0);
  return { borrowed, lent, net: lent - borrowed };
};

export const useRealAvailableBalance = () => {
  const availableBalance = useAvailableBalance();
  const { net } = useDebtsBalance();
  return availableBalance + net;
};

