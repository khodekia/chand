import Soup from 'gi://Soup?version=3.0';
const session = new Soup.Session();
const jar = new Soup.CookieJar();
session.add_feature(jar);
console.log("Success with add_feature(jar)");
session.add_feature_by_type(Soup.CookieJar);
console.log("Success with add_feature_by_type");
