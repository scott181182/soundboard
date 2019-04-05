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
            state: 'empty',
            loading: false,
            yturl: '',
            title: '',
            buffer: undefined,
            players: 0
        };
    },
    computed: {
        vid:     function() { return new URL(this.yturl).searchParams.get('v'); },
        playing: function() { return this.players > 0; },

        empty:       function() { return this.state.startsWith('empty'); },
        new_youtube: function() { return this.state == 'empty/youtube'; },
        new_file:    function() { return this.state == 'empty/file'; },
        ready:       function() { return this.state.startsWith('ready'); },
        editing:     function() { return this.state == 'ready/editing'; }
    },
    methods: {
        toggle_editing: function()
        {
            if(this.editing) { this.state = 'ready'; }
            else { this.state = 'ready/editing'; }
        },
        upload_file: function()
        {
            this.loading = true;
            const file = this.$refs.file.files[0];
            console.log(`Fetching '${file.name}' from computer`);

            if(!file) {
                console.error('No file to upload!');
                return this.reset_state();
            }
            console.log(typeof file);
            console.log(file);

            const reader = new FileReader();
            reader.onload = (event) => {
                console.log(typeof event.target.result);
                console.log(event.target.result);
                context.decodeAudioData(event.target.result)
                    .then(buffer => {
                        this.buffer = buffer;
                        this.title = file.name;
                        this.state = 'ready';
                    })
                    .catch(err => {
                        console.error(err);
                        alert(`There was an error loading '${file.name}'!`);
                    });
            };
            reader.onerror = (event) => {
                reader.abort();
                console.error(event);
                alert(`There was an error loading '${file.name}'!`);
                this.reset_state();
            };
            reader.readAsArrayBuffer(file);
        },
        load_sound: function()
        {
            this.loading = true;
            console.log(`Fetching '${this.vid}' from YouTube`);

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
                    this.state = 'ready';
                })
                .catch(err => { console.error(err); });
        },
        play_sound: function()
        {
            if(!this.buffer) {
                // console.log('No sound loaded!');
                return;
            }

            const source = context.createBufferSource();
            source.buffer = this.buffer;
            source.connect(context.destination);
            source.onended = () => { this.players--; };
            source.start();
            this.players++;
        },
        clear_sound: function() { this.reset_state(); },
        reset_state: function()
        {
            this.title = '';
            this.yturl = '';
            this.loading = false;
            this.state = 'empty';
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