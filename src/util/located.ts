export interface Locatable{
    line: number;
}

export interface Located<T> extends Locatable{
    val: T
};