const Vue = require ('vue');
const axios = require('axios');

const API = {
    INFO:  'api/info',
    AUDIO: 'api/audio'
};

const context = new AudioContext();


Vue.component('sound-box', {
    data: () => {
        return {
            empty: true,
            loading: false,
            editing: false,
            yturl: '',
            title: '',
            buffer: undefined,
            players: 0
        };
    },
    computed: {
        vid: function() { return new URL(this.yturl).searchParams.get('v'); },
        playing: function() { return this.players > 0; }
    },
    methods: {
        load_sound: function()
        {
            this.loading = true;
            console.log(`Fetching '${this.vid}'`);

            axios.get(`${API.INFO}/${this.vid}`)
                .then(res => {
                    const data = res.data.data;
                    this.title = data.title;

                    return axios({
                        method: 'get',
                        url: `${API.AUDIO}/${this.vid}`,
                        headers: { 'Content-Type': 'audio/mpeg' },
                        responseType: 'arraybuffer'
                    });
                })
                .then(res => context.decodeAudioData(res.data))
                .then(buffer => {
                    this.buffer = buffer;
                    this.loading = false;
                    this.empty = false;
                })
                .catch(err => { console.error(err); });
        },
        play_sound: function()
        {
            if(!this.buffer) { return console.log('No sound loaded!'); }

            const source = context.createBufferSource();
            source.buffer = this.buffer;
            source.connect(context.destination);
            source.onended = () => {
                this.players--;
                console.log(this.players);
            };
            source.start();
            this.players++;
            console.log(this.players);
        },
        clear_sound: function()
        {
            this.title = '';
            this.yturl = '';
            this.loading = false;
            this.empty = true;
            this.buffer = undefined;
        }
    },
    template: '#sound-box-template'
});

const app = new Vue({
    el: '#soundboard',
    data: {
        tile_count: 16
    }
});