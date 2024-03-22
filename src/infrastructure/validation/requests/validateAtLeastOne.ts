import * as yup from 'yup'


export function validateSyncByAtLeastOneScheme(schemes: yup.AnyObjectSchema[], body: any): void {
    let first_error: any = null;

    schemes.forEach((scheme) => {
        try {
            scheme.validateSync(body)
            return
        }
        catch (error) {if (first_error !== null) first_error = error}
    })
    throw first_error
}
