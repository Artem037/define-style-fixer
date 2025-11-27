const vscode = require('vscode');

/**
 * Преобразует имя макроса к виду UPPER_SNAKE_CASE
 */
function toUpperSnake(raw) {
  if (!raw) {
    return raw;
  }

  let s = raw.replace(/[^A-Za-z0-9]+/g, '_');
  s = s.replace(/_+/g, '_').replace(/^_+|_+$/g, '');

  return s.toUpperCase();
}

/**
 * Строит список правок для документа:
 * - приводит имена в #define к нужному виду;
 * - заменяет все использования этих макросов в файле.
 */
function collectDefineEdits(document) {
  const edits = [];

  // Ищем строку вида: #define ИМЯ ...
  const DEFINE_RE = /^\s*#\s*define\s+([A-Za-z_][A-Za-z0-9_]*)/;

  const renameMap = {}; // oldName -> newName
  const defineLines = new Set(); // номера строк с #define

  // Первый проход: ищем все #define и запоминаем, как их переименовать.
  for (let lineNum = 0; lineNum < document.lineCount; lineNum++) {
    const line = document.lineAt(lineNum);
    const text = line.text;
    const match = text.match(DEFINE_RE);

    if (!match) {
      continue;
    }

    defineLines.add(lineNum);

    const name = match[1];
    const targetName = toUpperSnake(name);

    if (targetName !== name) {
      renameMap[name] = targetName;

      const nameStartChar = text.indexOf(name);
      const nameEndChar = nameStartChar + name.length;
      const nameRange = new vscode.Range(
        new vscode.Position(lineNum, nameStartChar),
        new vscode.Position(lineNum, nameEndChar)
      );

      edits.push(new vscode.TextEdit(nameRange, targetName));
    }
  }

  const oldNames = Object.keys(renameMap);

  if (oldNames.length === 0) {
    return edits;
  }

  // Второй проход: заменяем использования макросов в остальных строках.
  for (let lineNum = 0; lineNum < document.lineCount; lineNum++) {
    const line = document.lineAt(lineNum);
    const text = line.text;

    if (defineLines.has(lineNum)) {
      continue;
    }

    for (const oldName of oldNames) {
      const newName = renameMap[oldName];
      const re = new RegExp(`\\b${oldName}\\b`, 'g');
      let match;

      while ((match = re.exec(text)) !== null) {
        const startChar = match.index;
        const endChar = startChar + oldName.length;

        const range = new vscode.Range(
          new vscode.Position(lineNum, startChar),
          new vscode.Position(lineNum, endChar)
        );

        edits.push(new vscode.TextEdit(range, newName));
      }
    }
  }

  // Сортируем правки с конца файла к началу.
  edits.sort((a, b) => {
    const aStart = a.range.start;
    const bStart = b.range.start;

    if (aStart.line !== bStart.line) {
      return bStart.line - aStart.line;
    }

    return bStart.character - aStart.character;
  });

  return edits;
}

/**
 * Активация расширения.
 */
function activate(context) {
  const disposable = vscode.commands.registerCommand(
    'defineStyleFixer.fixFile',
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showInformationMessage('Нет открытого файла.');
        return;
      }

      const edits = collectDefineEdits(editor.document);

      if (edits.length === 0) {
        vscode.window.showInformationMessage(
          'Define Style Fixer: ничего не нужно менять.'
        );
        return;
      }

      const workspaceEdit = new vscode.WorkspaceEdit();

      for (const edit of edits) {
        workspaceEdit.replace(editor.document.uri, edit.range, edit.newText);
      }

      await vscode.workspace.applyEdit(workspaceEdit);

      vscode.window.showInformationMessage(
        `Define Style Fixer: применено изменений: ${edits.length}.`
      );
    }
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
