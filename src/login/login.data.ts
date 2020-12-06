export class LoginData {
    private data: object[] = [
        { login: "admin", password: "admin", role: "admin"},
        { login: "client", password: "client", role: "client"}
    ]

    getData() {
        return this.data;
    }
}