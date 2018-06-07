import axios from 'axios'

// export const host = 'http://127.0.0.1:8000'
export const host = 'http://222.89.35.107:8191'


export const getTransform = params => {
    if ('id' in params) {
        return axios.get(`${host}/transform/` + params.id)
    } else if ('ordering' in params) {
        return axios.get(`${host}/transform/?ordering=` + params.ordering)
    } else if ('history' in params) {
        return axios.get(`${host}/transform/?min_date=` + params.min_date + '&max_date=' + params.max_date + '&page_size=1000&ordering=-id')
    }
}
