declare module 'turndown' {
  export interface TurndownOptions {
    headingStyle?: 'setext' | 'atx';
    codeBlockStyle?: 'indented' | 'fenced';
    bulletListMarker?: '-' | '+' | '*';
    emDelimiter?: '_' | '*';
    strongDelimiter?: '__' | '**';
    linkStyle?: 'inlined' | 'referenced';
    linkReferenceStyle?: 'full' | 'collapsed' | 'shortcut';
  }

  export default class TurndownService {
    constructor(options?: TurndownOptions);
    turndown(html: string): string;
    addRule(key: string, rule: any): this;
    keep(filter: any): this;
    remove(filter: any): this;
    use(plugin: any): this;
  }
}

