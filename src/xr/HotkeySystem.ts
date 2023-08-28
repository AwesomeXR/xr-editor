import hotkeys, { HotkeysEvent } from 'hotkeys-js';
import { CommandSystem } from './ViewModel/CommandSystem';
import { IXRCommand } from './IXRCommand';
import { XRProjectModel } from './ViewModel';

type IKeyMap = Record<
  string,
  {
    [C in keyof IXRCommand as string]: [C, IXRCommand[C]];
  }
>;

const DefaultKeyMap: IKeyMap = {
  '*': {
    'command+s, ctrl+s': ['Save', null],
    'command+z, ctrl+z': ['Undo', {}],
    'command+shift+z, ctrl+shift+z': ['Redo', {}],
    'command+v, ctrl+v': ['Paste', {}],
  },
  FlowEditor: {
    x: ['Scene_RemoveFlowNode', {}],
    a: ['InvokePanel', { method: 'PopupFlowNodeAddContextMenu' }],
    'command+c, ctrl+c': ['InvokePanel', { method: 'copy' }],
  },
  CanvasViewer: {
    '.': ['Scene_UpdateEDCamera', { target: 'picked' }],
  },
  ModelDesignMovieClip: {
    space: ['InvokePanel', { method: 'TogglePlay' }],
  },
};

export class HotkeySystem {
  private _logger = this.project.logger.extend('Hotkey');
  private _removeScopeChange?: any;

  constructor(
    private project: XRProjectModel,
    private cmdSys: CommandSystem
  ) {}

  private _b<S extends string, C extends keyof IXRCommand>(scope: S, key: string, cmd: C, arg: IXRCommand[C]) {
    const cmdItem = CommandSystem.build<C>(cmd, arg);

    const _handler = (ev: KeyboardEvent, info: HotkeysEvent) => {
      ev.preventDefault();

      this._logger.info('[%s] fire (%s) => %s', info.scope, info.key, cmd);
      this.cmdSys.execute(cmdItem.command, cmdItem.arg);
      return true;
    };

    this._logger.info('[%s] register: (%s) => %s', scope, key, cmd);

    if (scope === '*') hotkeys(key, _handler);
    else hotkeys(key, scope, _handler);
  }

  bind() {
    const _doSetScope = () => {
      hotkeys.setScope(this.project.workbench.wbScope.comp);
    };

    this._removeScopeChange = this.project.workbench.event.listen('scopeChange', _doSetScope);
    _doSetScope();

    for (const [scope, keyData] of Object.entries(DefaultKeyMap)) {
      for (const [key, cmdItem] of Object.entries(keyData)) {
        this._b(scope as any, key, cmdItem[0], cmdItem[1]);
      }
    }
  }

  unbind() {
    if (this._removeScopeChange) this._removeScopeChange();
    hotkeys.unbind();
  }
}
