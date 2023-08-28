import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router, Switch, Route, Link } from 'react-router-dom';
import { XRSetup } from '../src';

XRSetup();

const rc = (require as any).context('./page', true, /.tsx$/);
const pageModules = (rc.keys() as string[])
  .map(key => {
    const urlPath = key.replace('./', '/').replace('.tsx', '');
    const exported = rc(key);

    return { urlPath, Module: exported.default || exported[Object.keys(exported)[0]] };
  })
  .sort((a, b) => b.urlPath.length - a.urlPath.length || b.urlPath.localeCompare(a.urlPath));

console.log('@@@', 'pageModules ->', pageModules);

const App = () => {
  return (
    <Router>
      <Switch>
        {pageModules.map(pm => (
          <Route exact key={pm.urlPath} path={pm.urlPath}>
            {React.createElement(pm.Module, { key: pm.urlPath, path: pm.urlPath })}
          </Route>
        ))}
        <Route exact path='/'>
          <ul>
            {pageModules.map(pm => (
              <li key={pm.urlPath}>
                <Link to={pm.urlPath}>{pm.urlPath}</Link>
              </li>
            ))}
          </ul>
        </Route>
      </Switch>
    </Router>
  );
};

ReactDOM.render(<App />, document.getElementById('__root')!);

// for output lib test
export function sayHi() {
  console.log('hi');
}
