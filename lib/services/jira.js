function jql(tpl, data) {
    return tpl.replace(/\$([a-z0-9]+)/ig, (match, p1) => {
        const val = data[p1];

        if(typeof val === 'string') {
            return '"' + val + '"';
        }
        
        return val;
    });
}

module.exports = { jql };