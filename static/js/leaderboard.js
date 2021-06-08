// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {
    var formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });
    
    // This is the Vue data.
    app.data = {
        // Complete as you see fit.
        users: [],
    };

    app.enumerate_users = (users) => {
        let first = true;
        // This adds an _idx field to each element of the array.
        users.sort(function(a, b) {return b.value - a.value});
        let k = 0;
        users.map((e) => {
            e._idx = k++;
            e.balance = formatter.format(e.balance);
            e.value = formatter.format(e.value);
            e.first = first;
            first = false;
        });
        return users;
    };

    app.load_users = function(users) {
        for (let user of users) {
            user.balance = formatter.format(user.balance);
            user.value = formatter.format(user.value);
        }
    }

    // This contains all the methods.
    app.methods = {
    };

    // This creates the Vue instance.
    app.vue = new Vue({
        el: "#vue-target",
        data: app.data,
        methods: app.methods
    });

    // And this initializes it.
    app.init = () => {
        // Put here any initialization code.
        // Typically this is a server GET call to load the data.
        axios.get(get_users_url).then(function(response) {
            app.vue.users = app.enumerate_users(response.data.users);
        });
    };

    // Call to the initializer.
    app.init();
};

// This takes the (empty) app object, and initializes it,
// putting all the code i
init(app);
