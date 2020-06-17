import { signin, signout, useSession } from 'next-auth/client';

export default function Layout({ children }) {
    const [session, loading] = useSession();
    console.log("Session", session);
    return (
        <div>
            <div>
                {loading ? <p>Loading</p> :
                    session ? (
                        <div>
                            {session.user.name ? session.user.name : session.user.email}{' '}
                            <a href="/api/auth/signout" onClick={(e) => { e.preventDefault(); signout(); }}>Sign out</a>
                        </div>
                    ) : (
                            <div><a href="/api/auth/signin" onClick={(e) => { e.preventDefault(); signin(); }}>Sign in</a></div>
                        )}
            </div>
            {children}
        </div>
    );
}