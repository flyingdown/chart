import axios from 'axios'

// export const host = 'http://127.0.0.1:8000'
export const host = 'http://222.89.35.107:8191'


export const getTransform = params => {
    if ('id' in params) {
        return axios.get(`${host}/transform/` + params.id)
    } else if ('ordering' in params) {
        return axios.get(`${host}/transformlist/?ordering=` + params.ordering)
    } else {
        return axios.get(`${host}/transformlist/`, params)
    }
}
