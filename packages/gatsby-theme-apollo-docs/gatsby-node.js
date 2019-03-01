const path = require('path');
const simpleGit = require('simple-git/promise');
const matter = require('gray-matter');
const yaml = require('js-yaml');

const semverSegment = '(\\d+)(\\.\\d+){2}';
const semverPattern = new RegExp(semverSegment);
const tagPattern = new RegExp(`^v${semverSegment}$`);

const configPaths = ['gatsby-config.js', '_config.yml'];
async function getSidebarCategories(objects, git, version) {
  // check for config paths in our current set of objects
  const filePaths = objects.map(object => object.path);
  const existingConfig = configPaths.filter(configPath =>
    filePaths.includes(configPath)
  )[0];

  if (existingConfig) {
    const existingConfigText = await git.show([
      `${version}:./${existingConfig}`
    ]);

    // parse the config if it's YAML
    if (/\.yml$/.test(existingConfig)) {
      const yamlConfig = yaml.safeLoad(existingConfigText);
      return yamlConfig.sidebar_categories;
    }

    // TODO: handle js configs
  }

  return null;
}

exports.createPages = async (
  {actions},
  {contentDir, root, gitHubRepo, sidebarCategories}
) => {
  const git = simpleGit(root);
  const remotes = await git.getRemotes();
  if (!remotes.some(remote => remote.name === 'origin')) {
    await git.addRemote('origin', `https://github.com/${gitHubRepo}.git`);
    await git.fetch();
  }

  const [owner, repo] = gitHubRepo.split('/');
  const tagPatterns = [
    tagPattern,
    // account tags generated by lerna
    new RegExp(`^${repo}@${semverSegment}$`)
  ];

  // get a list of all tags that resemble a version
  const {all} = await git.tags({'--sort': '-v:refname'});
  const tags = all.filter(tag =>
    tagPatterns.some(pattern => pattern.test(tag))
  );

  console.log(tags);

  // map major version numbers to git tag
  let versions = tags.reduce((acc, tag) => {
    const match = tag.match(semverPattern);
    const version = match[1];
    return !acc[version] ? {...acc, [version]: tag} : acc;
  }, {});

  const versionKeys = Object.keys(versions)
    .sort()
    .reverse();
  const currentVersion = versionKeys[0];

  versions = await Promise.all(
    versionKeys.map(async key => {
      try {
        const version = versions[key];
        const tree = await git.raw(['ls-tree', '-r', version]);
        if (!tree) {
          return null;
        }

        const objects = tree.split('\n').map(object => ({
          mode: object.slice(0, object.indexOf(' ')),
          path: object.slice(object.lastIndexOf('\t') + 1)
        }));

        // use the provided `sidebarCategories` from Gatsby config for the
        // current (latest) version, or grab the appropriate config file for
        // the version at hand
        const isCurrentVersion = key === currentVersion;
        const versionSidebarCategories = isCurrentVersion
          ? sidebarCategories
          : await getSidebarCategories(objects, git, version);

        if (!versionSidebarCategories) {
          throw new Error(
            `No sidebar configuration found for this version: ${version}`
          );
        }

        // organize some arrays describing the repo contents that will be
        // useful later
        const markdown = objects.filter(({path}) => /\.mdx?$/.test(path));
        const markdownPaths = markdown.map(object => object.path);
        const docs = markdown.filter(({path}) => !path.indexOf(contentDir));

        console.log(key, docs);

        const contents = [];
        const basePath = isCurrentVersion ? '/' : `/v${key}/`;
        for (const category in versionSidebarCategories) {
          const sidebarItems = versionSidebarCategories[category];
          const categoryContents = await Promise.all(
            sidebarItems.map(async sidebarItem => {
              if (typeof sidebarItem !== 'string') {
                // sidebar items can be an object with `title` and `href`
                // properties to render a regular anchor tag
                return {
                  path: sidebarItem.href,
                  title: sidebarItem.title,
                  anchor: true
                };
              }

              const filePath = `${contentDir}/${sidebarItem}.md`;
              const doc = docs.find(({path}) => path === filePath);
              if (!doc) {
                throw new Error(`Doc not found: ${filePath}@v${key}`);
              }

              let text = await git.show([`${version}:./${filePath}`]);
              if (doc.mode === '120000') {
                // if the file is a symlink we need to follow it
                const directory = doc.path.slice(0, doc.path.lastIndexOf('/'));
                const symlink = path.resolve(`/${directory}`, text).slice(1);

                // ensure that the symlinked page exists because errors thrown
                // by `git.show` below cause subsequent git functions to fail
                if (!markdownPaths.includes(symlink)) {
                  return null;
                }

                text = await git.show([`${version}:${symlink}`]);
              }

              const repoRoot = await git.revparse(['--show-toplevel']);
              const docsRoot = root.replace(repoRoot.replace('\n', ''), '');

              const {content, data} = matter(text);
              return {
                ...data,
                content,
                path: basePath + sidebarItem.replace(/^index$/, ''),
                filePath: path.resolve(docsRoot, filePath)
              };
            })
          );

          contents.push({
            title: category === 'null' ? null : category,
            pages: categoryContents.filter(Boolean)
          });
        }

        const semver = versions[key].match(semverPattern)[0];
        return {
          id: key,
          basePath,
          majorMinor: semver.slice(0, semver.lastIndexOf('.')),
          contents,
          owner,
          repo,
          tag: version
        };
      } catch (error) {
        console.error(error);
        return null;
      }
    })
  );

  const template = require.resolve('./src/components/template');
  versions.filter(Boolean).forEach((version, index, array) => {
    version.contents.forEach(({pages}) => {
      pages.forEach(({path, filePath, title, description, content, anchor}) => {
        if (anchor) {
          // don't create pages for sidebar links
          return;
        }

        actions.createPage({
          path,
          component: template,
          context: {
            content,
            title,
            description,
            version,
            filePath,
            // use `array` here instead of `versions` because we're filtering
            // before the loop starts
            versions: array
          }
        });
      });
    });
  });
};
