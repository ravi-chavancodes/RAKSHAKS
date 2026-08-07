import 'package:flutter/material.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool isLogin = true;

  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xff0F172A),
              Color(0xff1D4ED8),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),

        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),

            child: Column(
              children: [

                const SizedBox(height: 50),

                // Logo
                Container(
                  height: 90,
                  width: 90,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(25),
                  ),

                  child: const Icon(
                    Icons.health_and_safety,
                    size: 55,
                    color: Color(0xff1D4ED8),
                  ),
                ),


                const SizedBox(height: 25),


                const Text(
                  "Nexora",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 34,
                    fontWeight: FontWeight.bold,
                  ),
                ),


                const SizedBox(height: 8),


                Text(
                  isLogin
                      ? "Welcome back, stay connected"
                      : "Create your safety account",
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 16,
                  ),
                ),


                const SizedBox(height: 45),


                Container(
                  padding: const EdgeInsets.all(24),

                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(30),
                  ),

                  child: Column(
                    children: [


                      if (!isLogin)
                        buildField(
                          "Full Name",
                          Icons.person_outline,
                          nameController,
                        ),


                      buildField(
                        "Email",
                        Icons.email_outlined,
                        emailController,
                      ),


                      buildField(
                        "Password",
                        Icons.lock_outline,
                        passwordController,
                        obscure: true,
                      ),


                      if (isLogin)
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () {},
                            child: const Text(
                              "Forgot Password?",
                            ),
                          ),
                        ),


                      const SizedBox(height: 20),


                      SizedBox(
                        width: double.infinity,

                        height: 55,

                        child: ElevatedButton(

                          style: ElevatedButton.styleFrom(

                            backgroundColor:
                                const Color(0xffDC2626),

                            shape:
                                RoundedRectangleBorder(

                              borderRadius:
                                  BorderRadius.circular(16),

                            ),
                          ),


                          onPressed: () {},


                          child: Text(

                            isLogin
                                ? "LOGIN"
                                : "CREATE ACCOUNT",

                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),

                          ),

                        ),
                      ),


                      const SizedBox(height: 20),


                      Row(
                        mainAxisAlignment:
                            MainAxisAlignment.center,

                        children: [

                          Text(
                            isLogin
                                ? "Don't have an account?"
                                : "Already have an account?",

                          ),

                          TextButton(

                            onPressed: () {

                              setState(() {

                                isLogin = !isLogin;

                              });

                            },

                            child: Text(

                              isLogin
                                  ? "Register"
                                  : "Login",

                              style: const TextStyle(

                                color:
                                    Color(0xff1D4ED8),

                                fontWeight:
                                    FontWeight.bold,

                              ),

                            ),

                          ),

                        ],
                      )

                    ],
                  ),
                )

              ],
            ),
          ),
        ),
      ),
    );
  }


  Widget buildField(
      String hint,
      IconData icon,
      TextEditingController controller,
      {
        bool obscure = false,
      }
      ) {

    return Padding(

      padding:
          const EdgeInsets.only(bottom: 16),

      child: TextField(

        controller: controller,

        obscureText: obscure,


        decoration: InputDecoration(

          hintText: hint,

          prefixIcon:
              Icon(icon),


          filled: true,

          fillColor:
              Colors.grey.shade100,


          border:
              OutlineInputBorder(

            borderRadius:
                BorderRadius.circular(16),

            borderSide:
                BorderSide.none,

          ),

        ),

      ),

    );
  }
}