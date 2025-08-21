import { DefaultUrlSerializer, UrlTree } from '@angular/router';

export class LowerCaseUrlSerializer extends DefaultUrlSerializer {
  override parse(url: string): UrlTree {
    const path = url.split('?')[0];
    const query = url.split('?')[1] || '';
    return super.parse(path.toLowerCase() + (query !== '' ? `?${query}`: ''));
  }
}
