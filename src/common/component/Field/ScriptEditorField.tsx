import { ExpandOutlined } from '@ant-design/icons';
import { Button, Drawer, Typography } from 'antd';
import _ from 'lodash';
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
  keymap,
  EditorView,
} from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import {
  foldGutter,
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  foldKeymap,
} from '@codemirror/language';
import { history, defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { useHandler } from '../../hook';

export interface IScriptEditorFieldProps {
  className?: string;
  style?: React.CSSProperties;
  mode?: 'text' | 'html' | 'javascript' | 'json';
  defaultValue?: string;
  onChange?: (code: string) => any;
}

export const ScriptEditorField = ({
  className,
  style,
  defaultValue = '',
  mode,
  onChange = () => {},
}: IScriptEditorFieldProps) => {
  const [visible, setVisible] = useState(false);
  const codeRef = useRef(defaultValue);

  const firstLineText = defaultValue.split('\n').find(t => t.length > 0);

  return (
    <>
      <div className={className} style={{ ...style }}>
        {firstLineText && (
          <Typography.Text code ellipsis>
            {firstLineText}
          </Typography.Text>
        )}
        <Button size='small' block icon={<ExpandOutlined />} onClick={() => setVisible(true)}>
          展开编辑
        </Button>
      </div>

      <Drawer
        destroyOnClose
        keyboard={false}
        className='OpenWorldEditor'
        width={500}
        title='脚本编辑'
        open={visible}
        onClose={() => {
          onChange?.(codeRef.current);
          setVisible(false);
        }}
      >
        <ScriptField
          defaultValue={defaultValue}
          onChange={code => {
            codeRef.current = code;
          }}
          mode={mode}
          style={{ height: '100%', background: '#1F1F1F' }}
        />
      </Drawer>
    </>
  );
};

const ScriptField = ({
  className,
  style,
  defaultValue = '',
  mode = 'text',
  onChange = () => {},
}: IScriptEditorFieldProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const ceViewRef = useRef<EditorView>();

  const onChangeHandler = useHandler(onChange);

  useLayoutEffect(() => {
    if (!ref.current) return;

    const basicSetup = [
      oneDark,
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([
        indentWithTab,
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
      ]),
    ];

    const ceView = (ceViewRef.current = new EditorView({
      doc: defaultValue,
      extensions: [basicSetup, javascript()],
      parent: ref.current,
      dispatch: tr => {
        ceView.update([tr]);
        if (tr.docChanged) {
          const docText = tr.newDoc + '';
          onChangeHandler(docText);
        }
      },
    }));

    return () => {
      ceView.destroy();
    };
  }, []);

  return <div ref={ref} className={className} style={{ ...style }}></div>;
};
