const fs = require("fs");
const path = require("path");

function walk(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith(".tsx") && !filePath.endsWith(".ts")) return;

  let content = fs.readFileSync(filePath, "utf-8");
  let originalContent = content;

  // Fix template string interpolation errors
  content = content.replace(/\{ id: \$\{([^}]+)\} \}/g, "{ id: $1 }");

  // Map hardcoded expo-router paths to screen names
  const routeMap = {
    "'(auth)/login'": "'Login'",
    "'(auth)/register'": "'Register'",
    "'(auth)/forgot-password'": "'ForgotPassword'",
    "'(auth)/reset-password'": "'ResetPassword'",
    "'(app)/edit-profile'": "'EditProfile'",
    "'(app)/wallet'": "'Wallet'",
    "'(app)/wallet/history'": "'WalletHistory'",
    "'(app)/wallet/withdraw'": "'WalletWithdraw'",
    "'(app)/recharge'": "'Recharge'",
    "'(app)/transactions'": "'Transactions'",
    "'/premium'": "'Premium'",
    "'/(auth)/login'": "'Login'",
    "'/(auth)/register'": "'Register'",
    "'/(auth)/forgot-password'": "'ForgotPassword'",
    "'/(auth)/reset-password'": "'ResetPassword'",
    "'/(app)/edit-profile'": "'EditProfile'",
    "'/(app)/wallet'": "'Wallet'",
    "'/(app)/wallet/history'": "'WalletHistory'",
    "'/(app)/wallet/withdraw'": "'WalletWithdraw'",
    "'/(app)/recharge'": "'Recharge'",
    "'/(app)/transactions'": "'Transactions'",
  };

  for (const [key, value] of Object.entries(routeMap)) {
    content = content.replaceAll(key, value);
  }

  // Also fix import for KeyboardAvoidingView if needed, or other syntax errors
  // Wait, some files had syntax errors like: error TS1128: Declaration or statement expected.
  // This was caused by the { id: ${...} } which we just fixed.

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Updated ${filePath}`);
  }
}

[
  "d:/exponew/chatting-platform/apps/boy-app/src",
  "d:/exponew/chatting-platform/apps/girl-app/src",
].forEach((dir) => {
  if (fs.existsSync(dir)) {
    walk(dir, processFile);
  }
});
