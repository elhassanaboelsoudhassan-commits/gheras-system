import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, runTransaction, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface ItemData {
  nameAr: string;
  nameEn: string;
  internalCode: string;
  barcode: string;
  mainCategory: string;
  subCategory: string;
  baseUnit: string;
  conversionFactor: number;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  minPrice: number;
  reorderLimit: number;
  maxLimit: number;
  location: string;
  stockQuantity: number; // Added stock quantity
  createdAt: string;
}

export const addItem = async (itemData: Omit<ItemData, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'items'), itemData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding document: ", error);
    return { success: false, error };
  }
};

export const getItems = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'items'));
    const items: (ItemData & { id: string })[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as ItemData & { id: string });
    });
    return { success: true, data: items };
  } catch (error) {
    console.error("Error getting documents: ", error);
    return { success: false, error };
  }
};

export interface SettingsData {
  companyNameAr: string;
  companyNameEn: string;
  taxNumber: string;
  nationalAddress: string;
  contactNumbers: string;
}

export const getSettings = async () => {
  try {
    const docRef = doc(db, 'settings', 'profile');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, id: docSnap.id, data: docSnap.data() as SettingsData };
    }
    return { success: true, data: null };
  } catch (error) {
    console.error("Error getting settings: ", error);
    return { success: false, error };
  }
};

export const updateSettings = async (id: string | null, settingsData: SettingsData) => {
  try {
    const docRef = doc(db, 'settings', 'profile');
    await setDoc(docRef, { ...settingsData }, { merge: true });
    return { success: true, id: 'profile' };
  } catch (error) {
    console.error("Error updating settings: ", error);
    return { success: false, error };
  }
};

// Sale Interface
export interface SaleItem {
  id: string; // The Firestore document ID of the item
  name: string;
  price: number;
  qty: number;
}

export interface SaleInvoice {
  items: SaleItem[];
  subTotal: number;
  vat: number;
  total: number;
  paymentMethod: string;
  branchId: string;
  createdAt: string;
}

export const processSale = async (invoiceData: SaleInvoice) => {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Read all items to ensure stock is sufficient
      const itemRefs = invoiceData.items.map(item => doc(db, 'items', item.id));
      const itemDocs = await Promise.all(itemRefs.map(ref => transaction.get(ref)));

      itemDocs.forEach((docSnap, index) => {
        if (!docSnap.exists()) {
          throw new Error(`Item ${invoiceData.items[index].name} does not exist!`);
        }
        const currentStock = docSnap.data().stockQuantity || 0;
        const requestedQty = invoiceData.items[index].qty;
        
        if (currentStock < requestedQty) {
          throw new Error(`Insufficient stock for ${invoiceData.items[index].name}. Available: ${currentStock}`);
        }
      });

      // 2. Perform all stock deductions
      itemDocs.forEach((docSnap, index) => {
        const currentStock = docSnap.data().stockQuantity || 0;
        const requestedQty = invoiceData.items[index].qty;
        transaction.update(docSnap.ref, { stockQuantity: currentStock - requestedQty });
      });

      // 3. Create the Invoice document
      const invoiceRef = doc(collection(db, 'invoices'));
      transaction.set(invoiceRef, invoiceData);

      // 4. Create the Accounting Journal Entry (Double-Entry)
      const journalRef = doc(collection(db, 'journal_entries'));
      transaction.set(journalRef, {
        referenceId: invoiceRef.id,
        date: invoiceData.createdAt,
        type: 'مبيعات',
        description: `فاتورة مبيعات POS رقم ${invoiceRef.id}`,
        totalAmount: invoiceData.total,
        entries: [
          // Debit: Cash/Bank (الصندوق/البنك) depending on payment method
          { accountName: invoiceData.paymentMethod === 'نقدي' ? 'الصندوق' : 'البنك', debit: invoiceData.total, credit: 0 },
          // Credit: Sales Revenue (إيرادات المبيعات) - Subtotal
          { accountName: 'إيرادات المبيعات', debit: 0, credit: invoiceData.subTotal },
          // Credit: VAT Payable (ضريبة القيمة المضافة المستحقة)
          { accountName: 'ضريبة القيمة المضافة المستحقة', debit: 0, credit: invoiceData.vat }
        ]
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Transaction failed: ", error);
    return { success: false, error: error.message };
  }
};

// Quotation Interfaces
export interface QuotationItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface QuotationData {
  issueDate: string;
  expiryDate: string;
  customerName: string;
  branch: string;
  items: QuotationItem[];
  discount: number;
  total: number;
  createdAt: string;
}

export const addQuotation = async (quotationData: Omit<QuotationData, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'quotations'), quotationData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding quotation: ", error);
    return { success: false, error };
  }
};

// HR Interfaces
export interface EmployeeData {
  empId: string;
  fullName: string;
  nationalId: string;
  nationality: string;
  jobTitle: string;
  branch: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  createdAt: string;
}

export interface CustodyData {
  employeeId: string;
  employeeName: string;
  type: string; // 'عهدة' or 'سلفة'
  amount: number;
  description: string;
  date: string;
  status: string; // 'نشطة', 'مسددة'
}

export interface PayrollEntry {
  employeeId: string;
  employeeName: string;
  basicSalary: number;
  allowances: number;
  bonus: number;
  deductions: number;
  advancesDeduction: number;
  netPay: number;
}

export interface PayrollData {
  month: string;
  status: string; // 'مسودة', 'معتمد'
  totalBasic: number;
  totalAllowances: number;
  totalBonus: number;
  totalDeductions: number;
  totalAdvances: number;
  netTotal: number;
  entries: PayrollEntry[];
  createdAt: string;
}

export const addEmployee = async (employeeData: Omit<EmployeeData, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'employees'), employeeData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding employee: ", error);
    return { success: false, error };
  }
};

export const getEmployees = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'employees'));
    const employees: (EmployeeData & { id: string })[] = [];
    querySnapshot.forEach((doc) => {
      employees.push({ id: doc.id, ...doc.data() } as EmployeeData & { id: string });
    });
    return { success: true, data: employees };
  } catch (error) {
    console.error("Error getting employees: ", error);
    return { success: false, error };
  }
};

// Add Custody with Journal Entry
export const processCustody = async (custodyData: Omit<CustodyData, 'id'>) => {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Create Custody document
      const custodyRef = doc(collection(db, 'custodies'));
      transaction.set(custodyRef, custodyData);

      // 2. Create Journal Entry
      const journalRef = doc(collection(db, 'journal_entries'));
      const accountName = custodyData.type === 'سلفة' ? 'سلف الموظفين' : 'عهد الموظفين';
      
      transaction.set(journalRef, {
        referenceId: custodyRef.id,
        date: custodyData.date,
        type: custodyData.type,
        description: `صرف ${custodyData.type} للموظف ${custodyData.employeeName} - ${custodyData.description}`,
        totalAmount: custodyData.amount,
        entries: [
          // Debit: Advances/Custodies
          { accountName: accountName, debit: custodyData.amount, credit: 0 },
          // Credit: Bank/Cash
          { accountName: 'الصندوق', debit: 0, credit: custodyData.amount }
        ]
      });
    });
    return { success: true };
  } catch (error: any) {
    console.error("Transaction failed: ", error);
    return { success: false, error: error.message };
  }
};

export const getCustodies = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'custodies'));
    const custodies: (CustodyData & { id: string })[] = [];
    querySnapshot.forEach((doc) => {
      custodies.push({ id: doc.id, ...doc.data() } as CustodyData & { id: string });
    });
    return { success: true, data: custodies };
  } catch (error) {
    console.error("Error getting custodies: ", error);
    return { success: false, error };
  }
};

// Process Payroll with Journal Entry
export const processPayroll = async (payrollData: Omit<PayrollData, 'id'>) => {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Create Payroll document
      const payrollRef = doc(collection(db, 'payrolls'));
      transaction.set(payrollRef, { ...payrollData, status: 'معتمد' });

      // 2. Create Journal Entry
      const journalRef = doc(collection(db, 'journal_entries'));
      
      const totalExpense = payrollData.totalBasic + payrollData.totalAllowances + payrollData.totalBonus;
      const totalPayable = payrollData.netTotal; // To Bank
      const advancesDeducted = payrollData.totalAdvances;
      
      transaction.set(journalRef, {
        referenceId: payrollRef.id,
        date: new Date().toISOString(),
        type: 'رواتب',
        description: `مسير رواتب شهر ${payrollData.month}`,
        totalAmount: totalExpense,
        entries: [
          // Debit: Salaries Expense
          { accountName: 'مصروفات الرواتب والأجور', debit: totalExpense, credit: 0 },
          // Credit: Advances/Custodies (repayment of loans)
          ...(advancesDeducted > 0 ? [{ accountName: 'سلف الموظفين', debit: 0, credit: advancesDeducted }] : []),
          // Credit: Bank (Net paid out)
          { accountName: 'البنك', debit: 0, credit: totalPayable },
          // (Ignoring other deductions for simplicity, if any, credit to other accounts)
          ...(payrollData.totalDeductions > 0 ? [{ accountName: 'إيرادات أخرى (خصومات)', debit: 0, credit: payrollData.totalDeductions }] : [])
        ]
      });
    });
    return { success: true };
  } catch (error: any) {
    console.error("Transaction failed: ", error);
    return { success: false, error: error.message };
  }
};

// Accounting Interfaces
export interface JournalEntryLine {
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id?: string;
  referenceId: string;
  date: string;
  type: string;
  description: string;
  totalAmount: number;
  entries: JournalEntryLine[];
}

export const getJournalEntries = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'journal_entries'));
    const entries: (JournalEntry & { id: string })[] = [];
    querySnapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() } as JournalEntry & { id: string });
    });
    return { success: true, data: entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) };
  } catch (error) {
    console.error("Error getting journal entries: ", error);
    return { success: false, error };
  }
};

export interface ChartOfAccount {
  code: string;
  name: string;
  type: 'أصول' | 'خصوم' | 'إيرادات' | 'مصروفات';
  balance: number;
}

// Helper to compute Trial Balance / Chart of Accounts from Journal Entries
export const computeTrialBalance = async () => {
  const res = await getJournalEntries();
  if (!res.success || !res.data) return { success: false, data: [] };

  const accountsMap = new Map<string, ChartOfAccount>();

  // Base Accounts Mapping for initialization (Standard 4-level Chart of Accounts)
  const baseAccounts: ChartOfAccount[] = [
    { code: '1001', name: 'الصندوق', type: 'أصول', balance: 0 },
    { code: '1002', name: 'البنك', type: 'أصول', balance: 0 },
    { code: '1003', name: 'سلف الموظفين', type: 'أصول', balance: 0 },
    { code: '1004', name: 'عهد الموظفين', type: 'أصول', balance: 0 },
    { code: '1005', name: 'المخزون', type: 'أصول', balance: 0 },
    { code: '2001', name: 'ضريبة القيمة المضافة المستحقة', type: 'خصوم', balance: 0 },
    { code: '2002', name: 'الدائنون (الموردين)', type: 'خصوم', balance: 0 },
    { code: '3001', name: 'إيرادات المبيعات', type: 'إيرادات', balance: 0 },
    { code: '3002', name: 'إيرادات أخرى (خصومات)', type: 'إيرادات', balance: 0 },
    { code: '4001', name: 'مصروفات الرواتب والأجور', type: 'مصروفات', balance: 0 },
    { code: '4002', name: 'تكلفة البضاعة المباعة', type: 'مصروفات', balance: 0 },
  ];

  baseAccounts.forEach(acc => accountsMap.set(acc.name, acc));

  // Process all entries
  res.data.forEach(entry => {
    entry.entries.forEach(line => {
      let acc = accountsMap.get(line.accountName);
      if (!acc) {
        // Fallback for unknown accounts created dynamically
        acc = { code: `9999-${Math.floor(Math.random()*1000)}`, name: line.accountName, type: 'مصروفات', balance: 0 };
        accountsMap.set(line.accountName, acc);
      }
      
      // Calculate normal balance based on type
      if (acc.type === 'أصول' || acc.type === 'مصروفات') {
        acc.balance += line.debit;
        acc.balance -= line.credit;
      } else {
        acc.balance += line.credit;
        acc.balance -= line.debit;
      }
    });
  });

  return { success: true, data: Array.from(accountsMap.values()) };
};

export interface SalesReturn {
  originalInvoiceId: string;
  items: SaleItem[];
  subTotal: number;
  vat: number;
  total: number;
  refundMethod: string;
  branchId: string;
  createdAt: string;
}

export const processSalesReturn = async (returnData: SalesReturn) => {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Read all items to ensure we can restock
      const itemRefs = returnData.items.map(item => doc(db, 'items', item.id));
      const itemDocs = await Promise.all(itemRefs.map(ref => transaction.get(ref)));

      // 2. Restock
      itemDocs.forEach((docSnap, index) => {
        if (docSnap.exists()) {
          const currentStock = docSnap.data().stockQuantity || 0;
          const returnedQty = returnData.items[index].qty;
          transaction.update(docSnap.ref, { stockQuantity: currentStock + returnedQty });
        }
      });

      // 3. Create the Sales Return document
      const returnRef = doc(collection(db, 'sales_returns'));
      transaction.set(returnRef, returnData);

      // 4. Create the Accounting Journal Entry (Reverse Sale)
      const journalRef = doc(collection(db, 'journal_entries'));
      transaction.set(journalRef, {
        referenceId: returnRef.id,
        date: returnData.createdAt,
        type: 'مرتجع مبيعات',
        description: `مرتجع مبيعات للفاتورة ${returnData.originalInvoiceId}`,
        totalAmount: returnData.total,
        entries: [
          // Debit: Sales Revenue
          { accountName: 'إيرادات المبيعات', debit: returnData.subTotal, credit: 0 },
          // Debit: VAT Payable
          { accountName: 'ضريبة القيمة المضافة المستحقة', debit: returnData.vat, credit: 0 },
          // Credit: Cash/Bank
          { accountName: returnData.refundMethod === 'نقدي' ? 'الصندوق' : 'البنك', debit: 0, credit: returnData.total }
        ]
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Transaction failed: ", error);
    return { success: false, error: error.message };
  }
};
