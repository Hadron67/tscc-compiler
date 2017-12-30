export interface ListNode<T>{
    prev: ListNode<T>;
    next: ListNode<T>;
    data: T;
}

export class List<T>{
    public head: ListNode<T>;
    public tail: ListNode<T>;
    public size: number = 0;
    constructor(){
        this.head = { prev: null, next: null, data: null};
        this.tail = { prev: null, next: null, data: null};
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }
    append(n: ListNode<T>): void{
        n.prev = this.tail.prev;
        n.next = this.tail;
        this.tail.prev.next = n;
        this.tail.prev = n;
        this.size++;
    }
    pull(): T{
        var n = this.head.next;
        this.head.next = n.next;
        n.next.prev = this.head;
        n.prev = n.next = null;
        this.size--;
        return n.data;
    }
    isEmpty(): boolean{
        return this.size === 0;
    }
    forEach(cb: (a: T) => void): void{
        for(var a = this.head.next;a !== this.tail;a = a.next){
            cb(a.data);
        }
    }
    remove(n: ListNode<T>): void{
        n.next.prev = n.prev;
        n.prev.next = n.next;
        this.size--;
    }
}