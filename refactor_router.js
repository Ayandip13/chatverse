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

  // Replace imports
  content = content.replace(
    /import \{([^}]*)\}\ from ['"]expo-router['"];?/g,
    (match, imports) => {
      let newImports = [];
      if (imports.includes("useRouter")) newImports.push("useNavigation");
      if (imports.includes("useLocalSearchParams")) newImports.push("useRoute");
      if (newImports.length === 0) return "";
      return `import { ${newImports.join(", ")} } from '@react-navigation/native';`;
    },
  );

  // Replace useRouter
  content = content.replace(
    /const router = useRouter\(\);/g,
    "const navigation = useNavigation<any>();",
  );

  // Replace useLocalSearchParams
  content = content.replace(
    /const \{([^}]+)\} = useLocalSearchParams\(\);/g,
    "const route = useRoute<any>();\n  const { $1 } = route.params;",
  );
  content = content.replace(
    /const params = useLocalSearchParams\(\);/g,
    "const route = useRoute<any>();\n  const params = route.params;",
  );

  // Route Name Mapping
  const routeMap = {
    "'/login'": "'Login'",
    "'/register'": "'Register'",
    "'/forgot-password'": "'ForgotPassword'",
    "'/reset-password'": "'ResetPassword'",
    "'/pending-verification'": "'PendingVerification'",
    "'/account-rejected'": "'AccountRejected'",
    "'/account-suspended'": "'AccountSuspended'",
    "'/home'": "'Home'",
    "'/search'": "'Search'",
    "'/profile'": "'Profile'",
    "'/chats'": "'Chats'",
    "'/settings'": "'Settings'",
    "'/wallet'": "'Wallet'",
    "'/favorites'": "'Favorites'",
    "'/notifications'": "'Notifications'",
    "'/transactions'": "'Transactions'",
    "'/recharge'": "'Recharge'",
    "'/legal'": "'Legal'",
    "'/help'": "'Help'",
    "'/chat-requests'": "'ChatRequests'",
    "'/edit-profile'": "'EditProfile'",
    "'/dashboard'": "'Dashboard'",
    "'/wallet/history'": "'WalletHistory'",
    "'/wallet/withdraw'": "'WalletWithdraw'",
  };

  function mapRoute(routeStr) {
    // Handling dynamic routes like `/chat/${id}`
    if (routeStr.includes("`/chat/")) {
      return `'ChatScreen', { id: ${routeStr.replace("`/chat/", "").replace("`", "")} }`;
    }
    if (routeStr.includes("`/girl/")) {
      return `'GirlDetailScreen', { id: ${routeStr.replace("`/girl/", "").replace("`", "")} }`;
    }
    // Handle specific mappings
    for (const [key, value] of Object.entries(routeMap)) {
      if (routeStr === key || routeStr === `\`${key.replace(/'/g, "")}\``) {
        return value;
      }
    }
    return routeStr;
  }

  // Replace router methods
  content = content.replace(
    /router\.push\((.*?)\)/g,
    (match, route) => `navigation.navigate(${mapRoute(route)})`,
  );
  content = content.replace(
    /router\.replace\((.*?)\)/g,
    (match, route) => `navigation.replace(${mapRoute(route)})`,
  );
  content = content.replace(/router\.back\(\)/g, "navigation.goBack()");

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
