# Define Style Fixer (VS Code Extension)

## 1. Описание

**Define Style Fixer** — это расширение для Visual Studio Code, которое помогает приводить макросы `#define` к оформлению в стиле Google C++ (ALL_CAPS_WITH_UNDERSCORES).

Плагин работает с C/C++-кодом и выполняет две основные задачи:

1. Приводит имена макросов в строках `#define` к виду `UPPER_SNAKE_CASE`.
2. Обновляет все использования этих макросов в текущем файле, чтобы код продолжал компилироваться.

Пример:

```cpp
до:

#define max_size 1024

int main() {
    int buffer[max_size];

    ...
}

после:

#define MAX_SIZE 1024

int main() {
    int buffer[MAX_SIZE];

    ...
}
```

## Установка

- Открыть папку с плагином в VS Code
- Запустить режим разработки расширения:
  - нажать `F5` (запустится отдельное окно **Extension Development Host**)
- (опционально) Для установки как обычного расширения можно собрать `.vsix` через `vsce package` и установить его через `Extensions` → `Install from VSIX...`.

## Использование

- Открыть файл с кодом на C/C++
- Вызвать команду:  
  - через `Ctrl + Shift + P` -> `Define Style Fixer: Fix Current File`
  - или через горячую клавишу, если она назначена
- Плагин:
  - найдёт все строки `#define`
  - приведёт имена макросов к `UPPER_SNAKE_CASE`
  - заменит все вхождения старых имён макросов в этом файле на новые

## Код плагина в `extension.js`:

- `toUpperSnake(raw)` - переводит строку в формат `UPPER_SNAKE_CASE`
- `collectDefineEdits(document, options)` - находит все `#define` в документе, строит список правок и заменяет:
  - имена в строках `#define`
  - все использования макросов в остальном тексте файла
- `activate(context)` - точка входа расширения, регистрирует команду `defineStyleFixer.fixFile` и применяет правки к активному редактору

## Конфигурация команды в `package.json`:

Содержит:
- идентификатор команды `defineStyleFixer.fixFile`,
- отображаемое имя `Define Style Fixer: Fix Current File`,
- список языков, для которых активируется расширение (C/C++/Objective-C).

## История коммитов:

- `3d556bc7486969b08dd43063062d134ff395a156` - Initial commit: VS Code Define Style Fixer
- `d8c07c0d4a20b547879bd7c3e99feff816b55a8c` - Fix extension