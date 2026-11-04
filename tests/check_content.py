"""Dependency-free static checks. Run from the repository root."""
from pathlib import Path
from html.parser import HTMLParser
import json
from urllib.parse import urlsplit
root=Path(__file__).resolve().parents[1]
class Links(HTMLParser):
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  for key in ('href','src'):
   value=attrs.get(key,'')
   if not value or value.startswith(('#','mailto:','tel:','http:','https:')): continue
   assert not value.startswith('/'),f'Root-relative URL: {value}'
   assert (self.base/urlsplit(value).path).is_file(),f'Missing asset: {value}'
for path in list(root.glob('*.html'))+list((root/'admin').glob('*.html')):
 parser=Links();parser.base=path.parent;parser.feed(path.read_text())
 content=path.read_text()
 assert '<title>' in content and ('name="description"' in content or path.parent.name=='admin'),path
for name in ['site','services','projects','testimonials']:
 json.loads((root/f'data/{name}.json').read_text())
projects=json.loads((root/'data/projects.json').read_text())
assert len({p['slug'] for p in projects})==len(projects),'Duplicate project slug'
for project in projects:
 assert project['demo'] or project.get('verified'), 'Unverified real project'
 for image in project['images']:
  assert image['alt'] and (root/image['src']).is_file()
 assert (root/project['cover']).is_file()
 pair=project.get('comparison')
 if pair:
  assert pair.get('verified') and pair['before']!=pair['after']
  assert (root/pair['before']).is_file() and (root/pair['after']).is_file()
print('PASS: HTML links, metadata, JSON, project slugs, image assets and content integrity')

config=json.loads((root/'data/config.json').read_text())
seen=set()
for studio in config['studios']:
 for kind,filename in studio['content'].items():
  assert filename not in seen,'Shared studio data path'
  seen.add(filename)
  target=(root/filename).resolve()
  assert target.is_relative_to(root.resolve()) and target.is_file(),filename
  json.loads(target.read_text())
print('PASS: central configuration studio content paths')

def require_asset(path):
 if not path: return
 asset=(root/path).resolve()
 assert path.startswith('assets/') and asset.is_relative_to(root.resolve()) and asset.is_file(),f'Missing studio image: {path}'
for studio in config['studios']:
 documents={kind:json.loads((root/path).read_text()) for kind,path in studio['content'].items()}
 for hero in documents['site']['hero']:require_asset(hero['image'])
 require_asset(documents['site'].get('logo'))
 for key in ('home','about'):require_asset(documents['site'].get(key,{}).get('image'))
 for service in documents['services']:require_asset(service['image'])
 for project in documents['projects']:
  require_asset(project['cover'])
  for image in project['images']:require_asset(image['src'])
  if project.get('comparison'):
   require_asset(project['comparison']['before']);require_asset(project['comparison']['after'])
print('PASS: image references across all configured studios')
