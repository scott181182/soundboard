const express = require('express');
const ytdl = require('ytdl-core');

const app = express();
const port = 9000;

app.get('/api/info/:vid', (req, res) => {
	const vid = req.params.vid;
	console.log(`Fetching vid '${vid}'...`);
	ytdl.getBasicInfo(vid, (err, info) => {
		if(err) {
			console.error(`Error on fetch '${vid}'.`);
			return res.status(500).send({ status: "error", error: err });
		}
		console.log(`Fetched ${vid}!`);
		const data = {
			title: info.title,
			thumbnail: info.thumbnail_url,
			vid: info.video_id
		}
		res.send({ status: "ok", data });
	});
});

app.get('/api/audio/:vid', (req, res) => {
	const vid = req.params.vid;
	const yturl = `https://www.youtube.com/watch?v=${vid}`;

	res.type('audio/mpeg');
	ytdl(yturl, { quality: 'highestaudio', filter: 'audioonly' }).pipe(res);
});

app.use(express.static('public'));
app.listen(port, () => {
	console.log(`Listening on port ${port}!`);
});