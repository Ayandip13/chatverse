const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Fix relative imports: '../../src/' -> '../../' and '../../../src/' -> '../../../'
  content = content.replace(/from '(\.\.\/)+src\//g, (match, p1) => {
    // If original was '../../../src/', we have one or more '../'
    return match.replace('src/', '');
  });

  // Fix lingering useLocalSearchParams
  if (content.includes('useLocalSearchParams()')) {
    content = content.replace(/const \{([^}]+)\} = useLocalSearchParams\(\);/g, 'const route = useRoute<any>();\n  const { $1 } = route.params;');
    content = content.replace(/const params = useLocalSearchParams\(\);/g, 'const route = useRoute<any>();\n  const params = route.params;');
  }
  
  if (content.includes('useLocalSearchParams') && !content.includes('import { useLocalSearchParams }')) {
    // maybe it wasn't replaced fully? 
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated imports in ${filePath}`);
  }
}

['d:/exponew/chatting-platform/apps/boy-app/src/screens', 'd:/exponew/chatting-platform/apps/girl-app/src/screens'].forEach(dir => {
  if (fs.existsSync(dir)) {
    walk(dir, processFile);
  }
});
