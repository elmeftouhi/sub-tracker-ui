// Utility to migrate existing subscriptions to new payment method structure
export const migratePaymentMethods = async () => {
  try {
    const { db } = await import('./database');
    const subscriptions = await db.subscriptions.toArray();
    
    const updates = subscriptions.map(sub => {
      // If subscription has old paymentMethod string but no new structure
      if (typeof sub.paymentMethod === 'string' && 
          sub.paymentMethod && 
          !['cash', 'credit-card', 'bank-transfer'].includes(sub.paymentMethod)) {
        
        // Guess the payment method type based on the old string
        let newPaymentMethod = 'cash';
        if (sub.paymentMethod.toLowerCase().includes('card') || 
            sub.paymentMethod.toLowerCase().includes('visa') ||
            sub.paymentMethod.toLowerCase().includes('mastercard') ||
            sub.paymentMethod.toLowerCase().includes('amex')) {
          newPaymentMethod = 'credit-card';
        } else if (sub.paymentMethod.toLowerCase().includes('bank') ||
                   sub.paymentMethod.toLowerCase().includes('transfer')) {
          newPaymentMethod = 'bank-transfer';
        }
        
        return db.subscriptions.update(sub.id, {
          paymentMethod: newPaymentMethod as "cash" | "credit-card" | "bank-transfer",
          updatedAt: new Date()
        });
      }
      return Promise.resolve();
    });
    
    await Promise.all(updates);
    console.log('Payment methods migrated successfully');
  } catch (error) {
    console.error('Failed to migrate payment methods:', error);
  }
};

// Run migration on app startup if needed
export const checkAndMigrate = () => {
  const migrationDone = localStorage.getItem('payment-method-migration-done');
  if (!migrationDone) {
    migratePaymentMethods().then(() => {
      localStorage.setItem('payment-method-migration-done', 'true');
    });
  }
};