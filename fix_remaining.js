const fs = require("fs");
const path = require("path");

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, "utf-8");
  let originalContent = content;

  // Fix lingering useLocalSearchParams
  content = content.replace(
    /const \{\s*([^\}]+)\s*\} = useLocalSearchParams\(\);/g,
    "const route = useRoute<any>();\n  const { $1 } = route.params;",
  );
  content = content.replace(
    /const params = useLocalSearchParams\(\);/g,
    "const route = useRoute<any>();\n  const params = route.params;",
  );
  content = content.replace(/useLocalSearchParams/g, "useRoute"); // Any remaining typings/references

  // Fix imports in ChatScreen and GirlDetailScreen which were moved up one directory level
  // (from app/(app)/chat/[id].tsx to src/screens/app/ChatScreen.tsx)
  // So `../../../` becomes `../../`
  if (
    filePath.includes("ChatScreen") ||
    filePath.includes("GirlDetailScreen")
  ) {
    content = content.replace(/from '\.\.\/\.\.\/\.\.\//g, "from '../../");
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Updated ${filePath}`);
  }
}

const filesToFix = [
  "d:/exponew/chatting-platform/apps/boy-app/src/screens/app/ChatScreen.tsx",
  "d:/exponew/chatting-platform/apps/boy-app/src/screens/app/GirlDetailScreen.tsx",
  "d:/exponew/chatting-platform/apps/boy-app/src/screens/app/legal.tsx",
  "d:/exponew/chatting-platform/apps/boy-app/src/screens/auth/reset-password.tsx",
  "d:/exponew/chatting-platform/apps/girl-app/src/screens/app/ChatScreen.tsx",
];

filesToFix.forEach(processFile);
