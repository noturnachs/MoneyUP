const db = require("../config/database");

class Transaction {
  static async create(transactionData) {
    const connection = await db.getConnection();

    try {
      // Get current balance from latest transaction
      const [latestTransaction] = await connection.execute(
        `SELECT current_balance FROM transactions 
         WHERE user_id = ? 
         ORDER BY date DESC, id DESC LIMIT 1`,
        [transactionData.user_id]
      );

      let currentBalance =
        latestTransaction.length > 0
          ? parseFloat(latestTransaction[0].current_balance)
          : 0;

      // Calculate new balance based on transaction type
      if (transactionData.type === "income") {
        currentBalance += parseFloat(transactionData.amount);
      } else if (transactionData.type === "expense") {
        currentBalance -= parseFloat(transactionData.amount);
      }

      // Insert new transaction with updated current_balance
      const query = `
        INSERT INTO transactions 
        (user_id, type, amount, category, description, date, current_balance) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await connection.execute(query, [
        transactionData.user_id,
        transactionData.type,
        transactionData.amount,
        transactionData.category,
        transactionData.description,
        transactionData.date || new Date(),
        currentBalance,
      ]);

      return result;
    } finally {
      connection.release();
    }
  }

  static async findByUserId(userId) {
    const query = `
      SELECT * FROM transactions 
      WHERE user_id = ? 
      ORDER BY date DESC
    `;

    const [rows] = await db.execute(query, [userId]);
    return rows;
  }

  static async update(id, transactionData) {
    const query = `
      UPDATE transactions 
      SET type = ?, amount = ?, category = ?, description = ?, date = ?
      WHERE id = ? AND user_id = ?
    `;

    const [result] = await db.execute(query, [
      transactionData.type,
      transactionData.amount,
      transactionData.category,
      transactionData.description,
      transactionData.date,
      id,
      transactionData.user_id,
    ]);

    return result;
  }

  static async delete(id, userId) {
    const query = "DELETE FROM transactions WHERE id = ? AND user_id = ?";
    const [result] = await db.execute(query, [id, userId]);
    return result;
  }
}

module.exports = Transaction;
