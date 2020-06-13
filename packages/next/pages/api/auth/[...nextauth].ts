import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';

const options = {
    site: 'http://localhost:3000',
    database: 'mongodb://authUser:123@localhost:27017/users?synchronize=true',
    providers: [
        Providers.Email({
            server: {
                port: 1025,
                host: 'localhost',
                tls: {
                    rejectUnauthorized: false
                }
            },
            from: 'account@example.com'
        })
    ],
    secret: "abckdklasefliajef",
    session: {
        jwt: true
    }
};

export default function auth(req, res) {
    return NextAuth(req, res, options);
}
