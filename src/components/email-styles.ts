export const EMAIL_STYLES = `
  :root {
    --primary: #FF4B6E;
    --primary-light: #FFE8EC;
    --secondary: #374151;
    --bg-light: #FFF5F7;
  }

  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    direction: rtl;
    background-color: var(--bg-light);
    color: var(--secondary);
    line-height: 1.6;
  }

  .box-container {
    max-width: 600px;
    margin: 0 auto;
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 30px rgba(255, 75, 110, 0.15);
  }

  .box-header {
    background: var(--primary);
    color: white;
    padding: 40px 24px;
    text-align: center;
    position: relative;
  }

  .box-header h2 {
    margin: 0;
    font-size: 32px;
    font-weight: bold;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .box-content {
    padding: 32px;
    background: white;
  }

  .box-field {
    margin-bottom: 28px;
    border: 1px solid var(--primary-light);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(255, 75, 110, 0.05);
    transition: all 0.3s ease;
  }

  .box-field:hover {
    border-color: var(--primary);
    box-shadow: 0 4px 12px rgba(255, 75, 110, 0.1);
  }

  .box-label {
    font-weight: bold;
    color: var(--primary);
    margin-bottom: 12px;
    font-size: 18px;
    display: block;
    letter-spacing: 0.5px;
  }

  .box-value {
    background: var(--bg-light);
    padding: 16px;
    border-radius: 8px;
    line-height: 1.6;
    font-size: 16px;
    color: var(--secondary);
  }

  .box-footer {
    text-align: center;
    padding: 32px 24px;
    color: white;
    background: var(--primary);
    border-top: 3px solid var(--primary-light);
    font-weight: 500;
    font-size: 16px;
    letter-spacing: 0.5px;
  }

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 24px 0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(255, 75, 110, 0.08);
  }

  th {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: white;
    padding: 16px;
    text-align: right;
    font-size: 16px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  td {
    padding: 16px;
    border-bottom: 1px solid var(--primary-light);
    font-size: 15px;
    line-height: 1.6;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background-color: var(--bg-light);
  }

  /* הוספת אנימציות ואפקטים */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .box-container {
    animation: fadeIn 0.5s ease-out;
  }

  /* שיפור קריאות בטלפון נייד */
  @media (max-width: 600px) {
    body {
      padding: 10px;
    }

    .box-header {
      padding: 30px 20px;
    }

    .box-header h2 {
      font-size: 24px;
    }

    .box-content {
      padding: 20px;
    }

    .box-field {
      padding: 15px;
      margin-bottom: 20px;
    }

    .box-label {
      font-size: 16px;
    }

    .box-value {
      font-size: 14px;
    }

    th, td {
      padding: 12px;
      font-size: 14px;
    }
  }
` 