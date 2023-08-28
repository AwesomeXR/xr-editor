import React, { useEffect, useState } from 'react';
import { XREditor } from '../../src';
import { MemoryFS } from 'ah-memory-fs';
import { XRProjectModel } from '../../src';
import { IndexedDBAdapter } from 'ah-memory-fs-indexed-db';
import OSS from 'ali-oss';
import Path from 'path';

const store = new OSS({
  region: DEPLOY_OSS_REGION,
  accessKeyId: DEPLOY_OSS_AK,
  accessKeySecret: DEPLOY_OSS_SK,
  bucket: DEPLOY_OSS_BUCKET,
});

const fetchRuntimeJsURL = async () => {
  const manifest = await fetch('./manifest.json')
    .then(r => r.json())
    .catch(() => {});

  if (manifest.js && Array.isArray(manifest.js)) {
    const _url = (manifest.js as string[]).find(_u => _u.includes('XRRuntimeStartup.'));

    if (_url) return _url;
  }

  throw new Error('missing RuntimeJsURL');
};

export const App = () => {
  const attachTo = 'XR-dev-1';

  const [project, setProject] = useState<XRProjectModel>();

  useEffect(() => {
    const _run = async () => {
      const mfs = await MemoryFS.create(() => IndexedDBAdapter.attach(attachTo));
      // const mfs = await MemoryFS.create(() => MemoryAdapter.empty());

      const runtimeURL = await fetchRuntimeJsURL();

      const _proj = new XRProjectModel(
        mfs,
        runtimeURL,
        async (data, path) => {
          path = Path.join('gw/xr-dev/assets', path);

          const headRsp = await store.head(path).catch(() => null);
          if (!headRsp) {
            let mime: string;

            if (data.type.includes('application/ktx')) mime = 'application/json'; // for CDN compress
            else mime = data.type;

            await store.put(path, data, {
              headers: { 'Cache-Control': `max-age=${3 * 365 * 24 * 60 * 60}`, 'Content-Type': mime },
            });
          }

          return ASSETS_ORIGIN + '/' + path;
        },
        async level => {
          console.log('@@@', 'request level ->', level);
        }
      );

      await _proj.reload();

      (window as any)._proj = _proj;

      setProject(_proj);
    };

    _run();
  }, []);

  useEffect(() => {
    if (project) {
      return () => {
        project.dispose();
      };
    }
  }, [project]);

  return (
    <div data-name='App'>
      {project && (
        <XREditor
          project={project}
          style={{ width: '100vw', height: '100vh' }}
          feature={{ allowedWorkbench: ['ModelDesign', 'AnimationDesign', 'LogicDesign', 'Export'] }}
        />
      )}
    </div>
  );
};
