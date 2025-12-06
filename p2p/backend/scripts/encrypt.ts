import CryptoJS, { enc } from "crypto-js";

const statementContent = `
	TypeType: Sign PDF
	Description: We hereby digitally sign the referenced PDF file.
	PDF file hash: LVA-iM5OERcktqK09KhOwcOCIY6LF-Nk3L7WvJdut40
`
const key = "75K6wJ1NVdluoBQPRsLr2w"

const urlSafe = (base64: string) => {
  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
const fromUrlSafe = (urlSafe: string) => {
  return urlSafe.replace(/-/g, "+").replace(/_/g, "/") + '='.repeat(urlSafe.length % 4);
}

const argv = (key) => {
  if (process.argv.includes(`--${key}`)) return true;
  const value = process.argv.find((i) => i.startsWith(`--${key}=`));
  if (!value) return null;
  return value.replace(`--${key}=`, "");
};

const encrypt = (data: string, key: string) => {
  const b64 = CryptoJS.AES.encrypt(data, key).toString();
  return urlSafe(b64);
};
const decrypt = (data: string, key: string) => {
  const b64 = fromUrlSafe(data);
  return CryptoJS.AES.decrypt(b64, key).toString(CryptoJS.enc.Utf8);
};

if (argv("encrypt")) {
  const data = argv("encrypt");
  const key = argv("key");
  // @ts-ignore
  console.log(encrypt(data, key));
}
if (argv("decrypt")) {
  const data = argv("decrypt");
  const key = argv("key");
  // @ts-ignore
  console.log(decrypt(data, key));
}
if(!argv("encrypt") && !argv("decrypt")) {
  console.log(encrypt(statementContent, key))
  console.log(decrypt(encrypt(statementContent, key), key))
  console.log(decrypt(
   urlSafe('U2FsdGVkX18Fxd5Pf8IYFp6XrHDU1EL3a3YTKHadIrzneo1n2d4ImOoJX2bO7oZEYQuPpSsNlUMN2Orghthvx6KcY2mIwKOx/cGNGJtOSTNqaf5Vij978fqrimJMfaGbzJTYg5lYe+KZPVOCIEvRDMZBZFVuOnHrPCwa4rePiJraZU8cmtJSYlJZKCv1IvkSNMQmjSCC1Q2aLALWhuj+6W11lq1krtkIojFNKy6rah4='), key))
}

