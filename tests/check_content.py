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
   assert (root/urlsplit(value).path).is_file(),f'Missing asset: {value}'
for path in root.glob('*.html'):
 parser=Links();parser.feed(path.read_text())
 content=path.read_text()
 assert '<title>' in content and 'name="description"' in content,path
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
