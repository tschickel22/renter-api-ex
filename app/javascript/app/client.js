// A tiny wrapper around fetch(), borrowed from
// https://kentcdodds.com/blog/replace-axios-with-a-simple-custom-fetch-wrapper

export async function client(endpoint, { body, ...customConfig } = {}) {
    let headers = {}

    if (!customConfig.forUpload) {
        let token = document.querySelector('meta[name="csrf-token"]').content;

        headers = {
            "Content-Type": "application/json",
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-Token': token
        }
    }

    const config = {
        method: body ? 'POST' : 'GET',
        ...customConfig,
        headers: {
            ...headers,
            ...customConfig.headers,
        },
    }

    if (body) {
        // Don't JSON-ify it if we aren't pushing JSON
        if (!customConfig.forUpload) {
            config.body = JSON.stringify(body)
        }
        else {
            config.body = body
        }

    }

    let data
    try {
        const response = await window.fetch(endpoint, config)

        if (!customConfig.forUpload && !customConfig.forDownload) {
            data = await response.json()
        }
        else {
            data = await response.text()
        }
        if (response.ok) {
            return data
        }
        throw new Error(response.statusText)
    } catch (err) {
        return Promise.reject(err.message ? err.message : data)
    }
}

client.get = function (endpoint, customConfig = {}) {
    return client(endpoint, { ...customConfig, method: 'GET' })
}

client.delete = function (endpoint, customConfig = {}) {
    return client(endpoint, { ...customConfig, method: 'DELETE' })
}

client.put = function (endpoint, body, customConfig = {}) {
    return client(endpoint, { ...customConfig, body, method: 'PUT' })
}

client.post = function (endpoint, body, customConfig = {}) {
    return client(endpoint, { ...customConfig, body })
}

client.call = function (method, endpoint, body, customConfig = {}) {
    return client(endpoint, { ...customConfig, body, method: method })
}

