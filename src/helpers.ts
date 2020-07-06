import fs from 'fs';
import path from 'path';
import { capitalizeFirstLetter, sortArrayAlphabetically, uniqueArray } from './utils';
import { newLineChar, spaceChar } from './constants';
import { Dictionary, ObjectType } from './types';
import { consoleLogErrorAndExit } from './cli';

function deleteDirectoryRecursive(directoryPath: string) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const currentPath = path.join(directoryPath, file);
      if (fs.lstatSync(currentPath).isDirectory()) {
        deleteDirectoryRecursive(currentPath);
      } else {
        fs.unlinkSync(currentPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}

export function prepareBuildDirectory(directoryPath: string) {
  deleteDirectoryRecursive(directoryPath);
  fs.mkdirSync(directoryPath, { recursive: true });
}

export function writeFile(filePath: string, code: string, insertAutoGeneratedNote = true) {
  if (insertAutoGeneratedNote) {
    code = [
      '/**',
      ' * This is auto-generated file, don\'t modify this file manually',
      ' */',
      '/* eslint-disable max-len */',
      '/* eslint-disable @typescript-eslint/no-empty-interface */',
    ].join(newLineChar) + newLineChar.repeat(2) + code.trim();
  }

  fs.mkdirSync(filePath.replace(path.basename(filePath), ''), { recursive: true });
  fs.writeFileSync(filePath, code.trim() + newLineChar);
}

export function prepareMethodsPattern(methodsPattern: string): Dictionary<boolean> {
  if (!methodsPattern) {
    consoleLogErrorAndExit('methodsPattern is empty. Pass "*" to generate all methods');
  }

  return methodsPattern.replace(/\s+/g, '').split(',').reduce<Dictionary<boolean>>((acc, pattern) => {
    acc[pattern] = true;
    return acc;
  }, {});
}

export function isMethodNeeded(methodsPattern: Dictionary<boolean>, method: string): boolean {
  const [methodSection, methodName] = method.split('.');

  return Object.keys(methodsPattern).some((pattern) => {
    const [patternSection, patternMethod] = pattern.split('.');
    if (patternSection === '*') {
      return true;
    }

    if (patternSection === methodSection) {
      return patternMethod === '*' || patternMethod === methodName;
    }

    return false;
  });
}

export function getMethodSection(methodName: string): string {
  return methodName.split('.')[0];
}

export function getInterfaceName(name: string): string {
  name = name.replace(/\.|(\s+)|_/g, ' ')
    .split(' ')
    .map((v) => capitalizeFirstLetter(v)).join('');

  return capitalizeFirstLetter(name);
}

export function getEnumPropertyName(name: string): string {
  return name.toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/\./g, '_');
}

export function getObjectNameByRef(ref: string): string {
  const parts = ref.split('/');
  return parts[parts.length - 1];
}

export function getSectionFromObjectName(name: string): string {
  return name.split('_')[0];
}

export function isPatternProperty(name: string): boolean {
  return name.startsWith('[key: ');
}

export function areQuotesNeededForProperty(name: string | number): boolean {
  name = String(name);

  if (isPatternProperty(name)) {
    return false;
  }

  if (/[&]/.test(name)) {
    return true;
  }
  return !(/^[a-z_]([a-z0-9_])+$/i.test(name) || /^[a-z_]/i.test(name));
}

export function transformPatternPropertyName(name: string): string {
  if (name === '^[0-9]+$') {
    return '[key: number]';
  }

  return '[key: string] /* default pattern property name */';
}

export function joinOneOfValues(values: Array<string | number>, primitive?: boolean) {
  const joined = values.join(' | ');

  if (joined.length > 120) {
    const spacesCount = primitive ? 2 : 4;
    return values.join(` |${newLineChar}${spaceChar.repeat(spacesCount)}`);
  } else {
    return joined;
  }
}

export function createImportsBlock(imports: Dictionary<boolean>, section: string | null, type?: ObjectType) {
  const objectsToImport = uniqueArray(Object.keys(imports));
  const paths: Dictionary<string[]> = {};

  objectsToImport.forEach((objectName) => {
    const importSection = getSectionFromObjectName(objectName);
    const interfaceName = getInterfaceName(objectName);
    let path;

    if (type === ObjectType.Object) {
      if (section === importSection) {
        path = `./${interfaceName}`;
      } else {
        path = `../${importSection}/${interfaceName}`;
      }
    } else {
      path = `../objects/${importSection}/${interfaceName}`;
    }

    if (!paths[path]) {
      paths[path] = [];
    }
    paths[path].push(interfaceName);
  });

  const importLines: string[] = [];

  sortArrayAlphabetically(Object.keys(paths)).forEach((path) => {
    const interfaces = sortArrayAlphabetically(paths[path]).join(', ');
    importLines.push(`import { ${interfaces} } from '${path}';`);
  });

  return importLines.join(newLineChar);
}