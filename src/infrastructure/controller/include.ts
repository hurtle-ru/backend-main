class CustomInclude {
    SEPARATOR = '.';
    includes: string[] | undefined

    constructor(
        includes: string[] | undefined
    ) { this.includes = includes }

    /**
    Advanced check include initially or full exist:
    @example
    ci = new CustomInclude(['person', 'person.post', 'person.post.comments.tags'])
    ci.include('person')                    // [true, true]
    ci.include('person.post')               // [true, true]
    ci.include('person.post.comments')      // [true, false]
    ci.include('person.post.comments.tags') // [false, true]
    */
    include(include: string): [initialMatch: boolean, fullMatch: boolean] {
        let initialMatch: boolean = false;
        let fullMatch: boolean = false;

        if (!this.includes) return [false, false]

        this.includes.forEach(( existInclude ) => {
            if ( !fullMatch && existInclude === include) fullMatch = true

            if ( !initialMatch && existInclude.startsWith( include + this.SEPARATOR ) ) {
                initialMatch = true
            }

            if ( fullMatch && initialMatch ) return [true, true]
        })

        return [initialMatch, fullMatch]
    }
}