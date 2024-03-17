export default class CustomInclude {
    SEPARATOR = '.';
    private includes_: string[] | undefined

    constructor(
        includes: string[] | undefined
    ) { this.includes_ = includes }

    /**
    Advanced check include initially or full exist:
    @example
    ci = new CustomInclude(['person', 'person.post', 'person.post.comments.tags'])
    ci.includes('person')                    // true
    ci.includes('person.post')               // true
    ci.includes('person.unknown')           // false
    ci.includes('person.post.comments')      // true
    ci.includes('person.post.comments.tags') // true
    */
    includes(value: string): boolean {
        if (!this.includes_) return false

        for ( const existInclude of this.includes_ ) {
            if (
                existInclude === value
                || existInclude.startsWith( value + this.SEPARATOR )
            ) return true
        }

        return false
    }
}

