const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');

module.exports.config = {
  name: "pinterest", // or "pin"
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  description: "Search for images on Pinterest.",
  usages: "pinterest [query] - [amount]",
  credits: "Juno",
};

async function getPinterest(img) {
  try {
    const { data } = await axios.get(`https://id.pinterest.com/search/pins/?autologin=true&q=${img}`, {
      headers: {
        cookie: "_auth=1; _b=\"AVna7S1p7l1C5I9u0+nR3YzijpvXOPc6d09SyCzO+DcwpersQH36SmGiYfymBKhZcGg=\"; _pinterest_sess=TWc9PSZHamJOZ0JobUFiSEpSN3Z4a2NsMk9wZ3gxL1NSc2k2NkFLaUw5bVY5cXR5alZHR0gxY2h2MVZDZlNQalNpUUJFRVR5L3NlYy9JZkthekp3bHo5bXFuaFZzVHJFMnkrR3lTbm56U3YvQXBBTW96VUgzVUhuK1Z4VURGKzczUi9hNHdDeTJ5Y2pBTmxhc2owZ2hkSGlDemtUSnYvVXh5dDNkaDN3TjZCTk8ycTdHRHVsOFg2b2NQWCtpOWxqeDNjNkk3cS85MkhhSklSb0hwTnZvZVFyZmJEUllwbG9UVnpCYVNTRzZxOXNJcmduOVc4aURtM3NtRFo3STlmWjJvSjlWTU5ITzg0VUg1NGhOTEZzME9SNFNhVWJRWjRJK3pGMFA4Q3UvcHBnWHdaYXZpa2FUNkx6Z3RNQjEzTFJEOHZoaHRvazc1c1UrYlRuUmdKcDg3ZEY4cjNtZlBLRTRBZjNYK0lPTXZJTzQ5dU8ybDdVS015bWJKT0tjTWYyRlBzclpiamdsNmtpeUZnRjlwVGJXUmdOMXdTUkFHRWloVjBMR0JlTE5YcmhxVHdoNzFHbDZ0YmFHZ1VLQXU1QnpkM1FqUTNMTnhYb3VKeDVGbnhNSkdkNXFSMXQybjRGL3pyZXRLR0ZTc0xHZ0JvbTJCNnAzQzE0cW1WTndIK0trY05HV1gxS09NRktadnFCSDR2YzBoWmRiUGZiWXFQNjcwWmZhaDZQRm1UbzNxc21pV1p5WDlabm1UWGQzanc1SGlrZXB1bDVDWXQvUis3elN2SVFDbm1DSVE5Z0d4YW1sa2hsSkZJb1h0MTFpck5BdDR0d0lZOW1Pa2RDVzNySWpXWmUwOUFhQmFSVUpaOFQ3WlhOQldNMkExeDIvMjZHeXdnNjdMYWdiQUhUSEFBUlhUVTdBMThRRmh1ekJMYWZ2YTJkNlg0cmFCdnU2WEpwcXlPOVZYcGNhNkZDd051S3lGZmo0eHV0ZE42NW8xRm5aRWpoQnNKNnNlSGFad1MzOHNkdWtER0xQTFN5Z3lmRERsZnZWWE5CZEJneVRlMDd2VmNPMjloK0g5eCswZUVJTS9CRkFweHc5RUh6K1JocGN6clc1JmZtL3JhRE1sc0NMTFlpMVErRGtPcllvTGdldz0="
      },
    });
    const $ = cheerio.load(data);
    const result = [];
    const image = [];
    $("div > a").each((_, element) => {
      const link = $(element).find("img").attr("src");
      if (link) result.push(link);
    });
    for (let v of result) {
      image.push(v.replace(/236/g, "736"));
    }
    image.shift();
    return image;
  } catch (error) {
    throw error;
  }
}

module.exports.run = async function({ api, event, args, prefix }) {
  const input = args.join(' ');
  const time = new Date();
  const timestamp = time.toISOString().replace(/[:.]/g, "-");

  if (!input) {
    api.sendMessage(`Please enter a prompt\nExample: pinterest albert einstein - 5`, event.threadID, event.messageID);
  } else {
    try {
      const key = input.split(" - ")[0];
      const len = parseInt(input.split(" - ").pop()) || 6;
      api.sendMessage(`Searching for ${key} images.`, event.threadID, event.messageID);

      const data = await getPinterest(key);
      let file = [];
      
      for (let i = 0; i < len; i++) {
        const path = `./script/cache/${timestamp}_${i + 1}.jpg`;
        const download = (await axios.get(data[i], { responseType: 'arraybuffer' })).data;
        fs.writeFileSync(path, Buffer.from(download, 'utf-8'));
        file.push(fs.createReadStream(path));
      }
      
      await api.sendMessage(
        { attachment: file, body: "Results:" },
        event.threadID,
        () => {
          file.forEach((_, i) => fs.unlinkSync(`./script/cache/${timestamp}_${i + 1}.jpg`));
        },
        event.messageID
      );
    } catch (error) {
      console.log(error);
    }
  }
};
